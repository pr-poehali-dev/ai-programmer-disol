const API_ENDPOINTS = {
  auth: 'https://functions.poehali.dev/38c2fe06-0fb3-43ee-bc43-c466aecb16f4',
  chat: 'https://functions.poehali.dev/655f6f08-9a5d-4dd9-954d-e2b46e0685b6',
  generate: 'https://functions.poehali.dev/0925db52-3515-4beb-9169-a522581e1976',
  projects: 'https://functions.poehali.dev/20e501af-5b76-411d-93a6-47d8fd5aaef6'
};

export const api = {
  async register(email: string, password: string, name: string) {
    const response = await fetch(API_ENDPOINTS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', email, password, name })
    });
    return response.json();
  },

  async login(email: string, password: string) {
    const response = await fetch(API_ENDPOINTS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password })
    });
    return response.json();
  },

  async sendMessage(userId: number, message: string, sessionId?: number) {
    const response = await fetch(API_ENDPOINTS.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, message, session_id: sessionId })
    });
    return response.json();
  },

  async getChatSessions(userId: number) {
    const response = await fetch(`${API_ENDPOINTS.chat}?user_id=${userId}`);
    return response.json();
  },

  async getChatMessages(userId: number, sessionId: number) {
    const response = await fetch(`${API_ENDPOINTS.chat}?user_id=${userId}&session_id=${sessionId}`);
    return response.json();
  },

  async generateContent(userId: number, type: 'code' | 'image' | 'video', prompt: string) {
    const response = await fetch(API_ENDPOINTS.generate, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, type, prompt })
    });
    return response.json();
  },

  async getProjects(userId: number, type?: string) {
    const url = type 
      ? `${API_ENDPOINTS.projects}?user_id=${userId}&type=${type}`
      : `${API_ENDPOINTS.projects}?user_id=${userId}`;
    const response = await fetch(url);
    return response.json();
  },

  async createProject(userId: number, title: string, type: string, content: string, language?: string) {
    const response = await fetch(API_ENDPOINTS.projects, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, title, type, content, language })
    });
    return response.json();
  }
};
