import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Index() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('chat');
  const [inputMessage, setInputMessage] = useState('');

  const menuItems = [
    { id: 'chat', icon: 'MessageSquare', label: 'Чат с ИИ' },
    { id: 'projects', icon: 'FolderKanban', label: 'Проекты' },
    { id: 'gallery', icon: 'Images', label: 'Галерея' },
    { id: 'history', icon: 'History', label: 'История' },
    { id: 'code', icon: 'Code2', label: 'Код' },
    { id: 'profile', icon: 'User', label: 'Профиль' }
  ];

  const mockArtifacts = [
    { id: 1, type: 'code', title: 'React Dashboard', date: '2 часа назад', language: 'TypeScript' },
    { id: 2, type: 'image', title: 'Логотип стартапа', date: '5 часов назад', format: 'PNG' },
    { id: 3, type: 'video', title: 'Промо-ролик', date: '1 день назад', duration: '0:45' },
    { id: 4, type: 'code', title: 'API Gateway', date: '2 дня назад', language: 'Python' }
  ];

  const mockMessages = [
    { role: 'assistant', content: 'Привет! Я DIsol — твой ИИ-помощник полного цикла. Могу создать код, изображения, видео или помочь с проектом. Что будем делать?' },
    { role: 'user', content: 'Создай дашборд для аналитики продаж' },
    { role: 'assistant', content: 'Отличная задача! Создаю React-компонент с графиками и таблицами. Используем Chart.js для визуализации.' }
  ];

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
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-all">
            <Avatar className="w-8 h-8 border-2 border-primary">
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-semibold">
                U
              </div>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Пользователь</p>
                <p className="text-xs text-muted-foreground">Pro Plan</p>
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
              Создаём будущее вместе с искусственным интеллектом
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary text-primary glow-effect">
              <Icon name="Sparkles" size={12} className="mr-1" />
              ИИ активен
            </Badge>
            <Button variant="ghost" size="icon">
              <Icon name="Settings" size={20} />
            </Button>
          </div>
        </header>

        {activeSection === 'chat' && (
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {mockMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="w-10 h-10 border-2 border-primary">
                      {msg.role === 'assistant' ? (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-secondary glow-effect flex items-center justify-center">
                          <Icon name="Bot" size={20} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-white text-sm font-semibold">
                          U
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
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </Card>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="glass-effect border-t border-border p-4">
              <div className="max-w-4xl mx-auto flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Опишите задачу: создать сайт, нарисовать картинку, написать код..."
                  className="flex-1 bg-muted border-border focus:border-primary"
                />
                <Button className="bg-gradient-to-r from-primary to-secondary glow-effect hover:opacity-90">
                  <Icon name="Send" size={20} />
                </Button>
                <Button variant="outline" className="border-primary/30">
                  <Icon name="Paperclip" size={20} />
                </Button>
              </div>
              <div className="max-w-4xl mx-auto mt-2 flex gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/20">
                  <Icon name="Code" size={12} className="mr-1" />
                  Код
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/20">
                  <Icon name="Image" size={12} className="mr-1" />
                  Изображение
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/20">
                  <Icon name="Video" size={12} className="mr-1" />
                  Видео
                </Badge>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'projects' && (
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Мои проекты</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Все ваши созданные артефакты в одном месте
                  </p>
                </div>
                <Button className="bg-gradient-to-r from-primary to-secondary glow-effect">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Новый проект
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockArtifacts.map((artifact) => (
                  <Card
                    key={artifact.id}
                    className="glass-effect hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center glow-effect ${
                            artifact.type === 'code'
                              ? 'bg-primary/20'
                              : artifact.type === 'image'
                              ? 'bg-secondary/20'
                              : 'bg-accent/20'
                          }`}
                        >
                          <Icon
                            name={
                              artifact.type === 'code'
                                ? 'Code2'
                                : artifact.type === 'image'
                                ? 'Image'
                                : 'Video'
                            }
                            size={24}
                          />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {artifact.type === 'code'
                            ? artifact.language
                            : artifact.type === 'image'
                            ? artifact.format
                            : artifact.duration}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                        {artifact.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{artifact.date}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'gallery' && (
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Галерея медиа</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Изображения и видео, созданные ИИ
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card
                    key={i}
                    className="aspect-square glass-effect hover:border-primary/50 transition-all cursor-pointer overflow-hidden group"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Icon name="Image" size={48} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'history' && (
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">История запросов</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Все ваши диалоги с ИИ
                </p>
              </div>
              <div className="space-y-3">
                {[
                  'Создай лендинг для IT-компании',
                  'Сгенерируй логотип в минималистичном стиле',
                  'Напиши функцию для сортировки массива',
                  'Создай промо-видео продукта'
                ].map((query, idx) => (
                  <Card
                    key={idx}
                    className="glass-effect hover:border-primary/50 transition-all cursor-pointer p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-effect">
                        <Icon name="MessageSquare" size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{query}</p>
                        <p className="text-xs text-muted-foreground">
                          {idx === 0 ? '10 минут назад' : `${idx + 1} часа назад`}
                        </p>
                      </div>
                      <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'code' && (
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Репозиторий кода</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Весь сгенерированный код и документация
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  { name: 'dashboard.tsx', lang: 'TypeScript', lines: 247 },
                  { name: 'api_gateway.py', lang: 'Python', lines: 183 },
                  { name: 'styles.css', lang: 'CSS', lines: 92 }
                ].map((file, idx) => (
                  <Card
                    key={idx}
                    className="glass-effect hover:border-primary/50 transition-all cursor-pointer p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center glow-effect">
                        <Icon name="FileCode" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium code-font">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.lang} • {file.lines} строк
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Icon name="Download" size={16} className="mr-2" />
                        Скачать
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Профиль</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Управление аккаунтом и настройки
                </p>
              </div>
              <Card className="glass-effect p-6 mb-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-20 h-20 border-4 border-primary glow-effect">
                    <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                      U
                    </div>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">Пользователь</h3>
                    <p className="text-sm text-muted-foreground">user@disol.ai</p>
                    <Badge className="mt-2 bg-gradient-to-r from-primary to-secondary">
                      Pro Plan
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm">Всего проектов</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm">Генераций ИИ</span>
                    <span className="font-semibold">1,847</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm">Использовано токенов</span>
                    <span className="font-semibold">2.4M</span>
                  </div>
                </div>
              </Card>
              <Button className="w-full bg-gradient-to-r from-primary to-secondary glow-effect">
                <Icon name="Settings" size={16} className="mr-2" />
                Настройки аккаунта
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
