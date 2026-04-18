-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table, security-critical)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Tasks
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Task documents
CREATE TABLE public.task_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_task_documents_task_id ON public.task_documents(task_id);

-- Enforce max 3 docs per task
CREATE OR REPLACE FUNCTION public.enforce_doc_limit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.task_documents WHERE task_id = NEW.task_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 documents per task';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_doc_limit BEFORE INSERT ON public.task_documents
FOR EACH ROW EXECUTE FUNCTION public.enforce_doc_limit();

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
  assigned_role app_role;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'user';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- profiles: everyone authenticated can view (needed for assignee dropdowns); only self or admin can update
CREATE POLICY "Profiles viewable by authenticated"
ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete profile"
ON public.profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: viewable by self & admins; only admins modify
CREATE POLICY "View own role or admin views all"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages roles insert"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages roles update"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages roles delete"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- tasks: users see own (created or assigned), admins see all
CREATE POLICY "View own or assigned tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Authenticated can create tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY "Update own tasks or admin"
ON public.tasks FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Delete own tasks or admin"
ON public.tasks FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- task_documents: visible if user can see task
CREATE POLICY "View documents of accessible tasks"
ON public.task_documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.id = task_id
    AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));
CREATE POLICY "Insert documents to accessible tasks"
ON public.task_documents FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.tasks t WHERE t.id = task_id
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Delete own uploaded documents or admin"
ON public.task_documents FOR DELETE TO authenticated
USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Storage bucket for task documents (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('task-documents', 'task-documents', false);

-- Storage policies — files stored under {task_id}/{filename}
CREATE POLICY "Authenticated read task docs they can see"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'task-documents'
  AND EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id::text = (storage.foldername(name))[1]
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Authenticated upload task docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'task-documents'
  AND EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id::text = (storage.foldername(name))[1]
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Delete own task docs or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'task-documents'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'))
);