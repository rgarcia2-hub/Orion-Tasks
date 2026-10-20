export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  notes?: string;
  due?: string;
  completed?: string;
  updated?: string;
  deleted?: boolean;
}

// Fetch all task lists from Google Tasks
export async function fetchGoogleTaskLists(accessToken: string): Promise<GoogleTaskList[]> {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al obtener listas de Google Tasks: ${res.statusText}`);
  }

  const data = await res.json();
  return (data.items || []).map((list: any) => ({
    id: list.id,
    title: list.title || 'Lista sin nombre',
    updated: list.updated,
  }));
}

// Fetch tasks for a given task list
export async function fetchGoogleTasks(accessToken: string, taskListId: string): Promise<GoogleTaskItem[]> {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
    taskListId
  )}/tasks?showCompleted=true&showHidden=true&maxResults=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al obtener tareas de Google Tasks: ${res.statusText}`);
  }

  const data = await res.json();
  return (data.items || []).map((t: any) => ({
    id: t.id,
    title: t.title || '(Sin título)',
    status: t.status === 'completed' ? 'completed' : 'needsAction',
    notes: t.notes || '',
    due: t.due,
    completed: t.completed,
    updated: t.updated,
    deleted: Boolean(t.deleted),
  }));
}

// Create a task in Google Tasks
export async function createGoogleTask(
  accessToken: string,
  taskListId: string,
  task: { title: string; notes?: string; due?: string }
): Promise<GoogleTaskItem> {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`;

  const body: Record<string, any> = {
    title: task.title,
  };
  if (task.notes) body.notes = task.notes;
  if (task.due) {
    // RFC 3339 timestamp format required
    body.due = new Date(task.due).toISOString();
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al crear tarea en Google Tasks: ${res.statusText}`);
  }

  return await res.json();
}

// Update task status or fields in Google Tasks
export async function updateGoogleTask(
  accessToken: string,
  taskListId: string,
  taskId: string,
  updates: {
    status?: 'needsAction' | 'completed';
    title?: string;
    notes?: string;
    due?: string;
  }
): Promise<GoogleTaskItem> {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
    taskListId
  )}/tasks/${encodeURIComponent(taskId)}`;

  const body: Record<string, any> = {};
  if (updates.status !== undefined) {
    body.status = updates.status;
    if (updates.status === 'completed') {
      body.completed = new Date().toISOString();
    }
  }
  if (updates.title !== undefined) body.title = updates.title;
  if (updates.notes !== undefined) body.notes = updates.notes;
  if (updates.due !== undefined) body.due = updates.due ? new Date(updates.due).toISOString() : null;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al actualizar tarea en Google Tasks: ${res.statusText}`);
  }

  return await res.json();
}

// Delete task from Google Tasks
export async function deleteGoogleTask(
  accessToken: string,
  taskListId: string,
  taskId: string
): Promise<void> {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
    taskListId
  )}/tasks/${encodeURIComponent(taskId)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al eliminar tarea de Google Tasks: ${res.statusText}`);
  }
}
