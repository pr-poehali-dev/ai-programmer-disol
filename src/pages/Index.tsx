import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { SpeechRecognition } from '@/lib/speech';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  name: string;
}

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface Project {
  id: number;
  title: string;
  type: string;
  content: string;
  language?: string;
  created_at: string;
}

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const { toast } = useToast();
  const speechRecognition = useRef(new SpeechRecognition());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('disol_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
      loadProjects(userData.id);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProjects = async (userId: number) => {
    try {
      const response = await api.getProjects(userId);
      if (response.projects) {
        setProjects(response.projects);
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await api.login(authForm.email, authForm.password);
      } else {
        response = await api.register(authForm.email, authForm.password, authForm.name);
      }

      if (response.success) {
        const userData = response.user;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('disol_user', JSON.stringify(userData));
        localStorage.setItem('disol_token', response.token);
        toast({
          title: 'Успешно!',
          description: isLogin ? 'Вы вошли в систему' : 'Регистрация завершена'
        });
        loadProjects(userData.id);
      } else {
        toast({
          title: 'Ошибка',
          description: response.error || 'Произошла ошибка',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка соединения',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.sendMessage(user.id, inputMessage, currentSessionId);
      
      if (response.success) {
        if (!currentSessionId) {
          setCurrentSessionId(response.session_id);
        }

        const aiMessage: Message = {
          role: 'assistant',
          content: response.message
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        toast({
          title: 'Ошибка',
          description: response.error || 'Не удалось отправить сообщение',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: 'Проверьте API ключи в настройках проекта',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (type: 'code' | 'image' | 'video') => {
    if (!inputMessage.trim() || !user || isLoading) return;

    setIsLoading(true);
    toast({
      title: 'Генерация...',
      description: `Тимур создаёт ${type === 'code' ? 'код' : type === 'image' ? 'изображение' : 'видео'}`
    });

    try {
      const response = await api.generateContent(user.id, type, inputMessage);

      if (response.success) {
        toast({
          title: 'Готово!',
          description: `${type === 'code' ? 'Код' : type === 'image' ? 'Изображение' : 'Видео'} создано`
        });
        
        setInputMessage('');
        await loadProjects(user.id);
        setActiveSection('projects');
      } else {
        toast({
          title: 'Ошибка',
          description: response.error || response.message || 'Не удалось создать контент',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка генерации',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (!speechRecognition.current.isSupported()) {
      toast({
        title: 'Не поддерживается',
        description: 'Ваш браузер не поддерживает голосовой ввод',
        variant: 'destructive'
      });
      return;
    }

    setIsListening(true);
    speechRecognition.current.start(
      (text) => {
        setInputMessage(text);
        setIsListening(false);
        toast({
          title: 'Распознано',
          description: text
        });
      },
      (error) => {
        setIsListening(false);
        toast({
          title: 'Ошибка',
          description: 'Не удалось распознать речь',
          variant: 'destructive'
        });
      }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('disol_user');
    localStorage.removeItem('disol_token');
    setUser(null);
    setIsAuthenticated(false);
    setMessages([]);
    setProjects([]);
  };

  const menuItems = [
    { id: 'chat', icon: 'MessageSquare', label: 'Чат с Тимур' },
    { id: 'projects', icon: 'FolderKanban', label: 'Проекты' },
    { id: 'profile', icon: 'User', label: 'Профиль' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md glass-effect p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary glow-effect flex items-center justify-center">
              <span className="text-white font-bold text-2xl">DI</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 glow-text">DIsol</h1>
          <p className="text-center text-muted-foreground mb-6">
            ИИ-программист Тимур ждёт вас
          </p>

          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setIsLogin(true)}
              variant={isLogin ? 'default' : 'outline'}
              className="flex-1"
            >
              Вход
            </Button>
            <Button
              onClick={() => setIsLogin(false)}
              variant={!isLogin ? 'default' : 'outline'}
              className="flex-1"
            >
              Регистрация
            </Button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="Ваше имя"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                className="bg-muted"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              className="bg-muted"
              required
            />
            <Input
              type="password"
              placeholder="Пароль"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              className="bg-muted"
              required
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary glow-effect"
              disabled={isLoading}
            >
              {isLoading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside 
        className={`glass-effect border-r border-border transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary glow-effect flex items-center justify-center">
                <span className="text-white font-bold text-sm">DI</span>
              </div>
              <span className="font-semibold text-lg glow-text">DIsol</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-muted"
          >
            <Icon name={sidebarOpen ? 'PanelLeftClose' : 'PanelLeftOpen'} size={20} />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === item.id
                  ? 'bg-primary text-primary-foreground glow-effect'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Icon name={item.icon} size={20} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-all"
          >
            <Avatar className="w-8 h-8 border-2 border-primary">
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Выйти</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="glass-effect border-b border-border p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold glow-text">
              {menuItems.find(item => item.id === activeSection)?.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              ИИ-программист Тимур к вашим услугам
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary text-primary glow-effect">
              <Icon name="Sparkles" size={12} className="mr-1" />
              Тимур активен
            </Badge>
          </div>
        </header>

        {activeSection === 'chat' && (
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.length === 0 && (
                  <Card className="glass-effect p-6 text-center">
                    <Icon name="Bot" size={48} className="mx-auto mb-4 text-primary" />
                    <h2 className="text-xl font-semibold mb-2">Привет! Я Тимур 👋</h2>
                    <p className="text-muted-foreground">
                      Ваш ИИ-программист полного цикла. Могу создать код, изображения, видео или помочь с проектом.
                    </p>
                  </Card>
                )}
                
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="w-10 h-10 border-2 border-primary flex-shrink-0">
                      {msg.role === 'assistant' ? (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-secondary glow-effect flex items-center justify-center">
                          <Icon name="Bot" size={20} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-white text-sm font-semibold">
                          {user?.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <Card
                      className={`flex-1 p-4 ${
                        msg.role === 'user'
                          ? 'bg-primary/20 border-primary/30'
                          : 'glass-effect'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </Card>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4">
                    <Avatar className="w-10 h-10 border-2 border-primary">
                      <div className="w-full h-full bg-gradient-to-br from-primary to-secondary glow-effect flex items-center justify-center">
                        <Icon name="Bot" size={20} className="text-white animate-pulse" />
                      </div>
                    </Avatar>
                    <Card className="flex-1 p-4 glass-effect">
                      <p className="text-sm text-muted-foreground">Тимур думает...</p>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="glass-effect border-t border-border p-4">
              <div className="max-w-4xl mx-auto flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Создай сайт, нарисуй картинку, напиши код..."
                  className="flex-1 bg-muted border-border focus:border-primary"
                  disabled={isLoading}
                />
                <Button 
                  onClick={startVoiceInput}
                  variant="outline" 
                  className={`border-primary/30 ${isListening ? 'bg-primary/20' : ''}`}
                  disabled={isLoading || isListening}
                >
                  <Icon name={isListening ? 'MicOff' : 'Mic'} size={20} />
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-primary to-secondary glow-effect hover:opacity-90"
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <Icon name="Send" size={20} />
                </Button>
              </div>
              <div className="max-w-4xl mx-auto mt-2 flex gap-2">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/20"
                  onClick={() => handleGenerate('code')}
                >
                  <Icon name="Code" size={12} className="mr-1" />
                  Создать код
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/20"
                  onClick={() => handleGenerate('image')}
                >
                  <Icon name="Image" size={12} className="mr-1" />
                  Создать изображение
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/20"
                  onClick={() => handleGenerate('video')}
                >
                  <Icon name="Video" size={12} className="mr-1" />
                  Создать видео
                </Badge>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'projects' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Мои проекты</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {projects.length} созданных артефактов
                  </p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-primary to-secondary glow-effect"
                  onClick={() => setActiveSection('chat')}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Новый проект
                </Button>
              </div>

              {projects.length === 0 ? (
                <Card className="glass-effect p-12 text-center">
                  <Icon name="FolderOpen" size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Пока нет проектов</h3>
                  <p className="text-muted-foreground mb-4">
                    Создайте первый проект с помощью Тимур
                  </p>
                  <Button 
                    onClick={() => setActiveSection('chat')}
                    className="bg-gradient-to-r from-primary to-secondary glow-effect"
                  >
                    Начать диалог
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Card
                      key={project.id}
                      className="glass-effect hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center glow-effect ${
                              project.type === 'code'
                                ? 'bg-primary/20'
                                : project.type === 'image'
                                ? 'bg-secondary/20'
                                : 'bg-accent/20'
                            }`}
                          >
                            <Icon
                              name={
                                project.type === 'code'
                                  ? 'Code2'
                                  : project.type === 'image'
                                  ? 'Image'
                                  : 'Video'
                              }
                              size={24}
                            />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {project.language || project.type}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString('ru-RU')}
                        </p>
                        {project.type === 'image' && project.content && (
                          <img 
                            src={project.content} 
                            alt={project.title}
                            className="mt-3 rounded-lg w-full h-32 object-cover"
                          />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Профиль</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Управление аккаунтом
                </p>
              </div>
              <Card className="glass-effect p-6 mb-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-20 h-20 border-4 border-primary glow-effect">
                    <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className="mt-2 bg-gradient-to-r from-primary to-secondary">
                      Pro Plan
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm">Всего проектов</span>
                    <span className="font-semibold">{projects.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm">ИИ программист</span>
                    <span className="font-semibold">Тимур</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm">Дата регистрации</span>
                    <span className="font-semibold">Сегодня</span>
                  </div>
                </div>
              </Card>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
              >
                <Icon name="LogOut" size={16} className="mr-2" />
                Выйти из аккаунта
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
