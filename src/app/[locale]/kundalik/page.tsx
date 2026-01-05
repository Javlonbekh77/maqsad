'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { getJournalEntry, saveJournalEntry, getAllJournalEntries, getUser } from '@/lib/data';
import { format, addDays, isToday, isFuture, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Save, Calendar, Coins } from 'lucide-react';
import { useRouter } from '@/navigation';

export default function KundalikPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [dailyCoinEarned, setDailyCoinEarned] = useState(false);

  // Load user data and all entries
  useEffect(() => {
    if (!authUser) return;

    const loadData = async () => {
      const userData = await getUser(authUser.id);
      setUser(userData);
      
      const entries = await getAllJournalEntries(authUser.id);
      setAllEntries(entries);
    };

    loadData();
  }, [authUser]);

  // Load entry for selected date
  useEffect(() => {
    if (!authUser) return;

    const loadEntry = async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const entry = await getJournalEntry(authUser.id, dateStr);
      
      if (entry) {
        setContent(entry.content);
        setLastSaved(entry.updatedAt?.toDate?.().toLocaleString?.() || '');
      } else {
        setContent('');
        setLastSaved('');
      }
      
      // Check if coin was earned today
      const today = format(new Date(), 'yyyy-MM-dd');
      setDailyCoinEarned(user?.lastJournalRewardDate === today);
    };

    loadEntry();
  }, [selectedDate, authUser, user]);

  const handleSave = useCallback(async () => {
    if (!authUser) return;
    
    setIsSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await saveJournalEntry(authUser.id, dateStr, content);
      
      setLastSaved(new Date().toLocaleString());
      
      // Reload user data to get updated coins
      const userData = await getUser(authUser.id);
      setUser(userData);
      
      // Reload entries
      const entries = await getAllJournalEntries(authUser.id);
      setAllEntries(entries);
      
      // Update coin status
      const today = format(new Date(), 'yyyy-MM-dd');
      setDailyCoinEarned(userData?.lastJournalRewardDate === today);
    } catch (e) {
      console.error('Error saving journal entry:', e);
      alert('Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    } finally {
      setIsSaving(false);
    }
  }, [authUser, selectedDate, content]);

  const handleDateChange = (days: number) => {
    const newDate = addDays(selectedDate, days);
    // Don't allow dates in the future
    if (!isFuture(newDate)) {
      setSelectedDate(newDate);
    }
  };

  const goToToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  if (!authUser || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
          <p className="text-muted-foreground">Yuklash...</p>
        </div>
      </AppLayout>
    );
  }

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dateDisplay = format(selectedDate, 'MMMM d, yyyy');
  const isCurrentDay = isToday(selectedDate);
  const hasEntry = allEntries.some(e => e.date === dateStr);

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Journal Editor */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kundalik Daftari</CardTitle>
                  <CardDescription>
                    {isCurrentDay ? 'Bugungi kunni qayd qiling' : `${dateDisplay} qaydlari`}
                  </CardDescription>
                </div>
                {isCurrentDay && dailyCoinEarned && (
                  <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-2 rounded-lg">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium">+1 kumush tanga</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Date Navigation */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateChange(-1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Oldingi kun
                </Button>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{dateDisplay}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateChange(1)}
                  disabled={isFuture(addDays(selectedDate, 1))}
                >
                  Keyingi kun
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {!isCurrentDay && (
                <Button
                  variant="outline"
                  className="mb-6 w-full"
                  onClick={goToToday}
                >
                  Bugungi kuni ko'rish
                </Button>
              )}

              {/* Journal Editor */}
              <div className="space-y-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Bu kunning fikr-mulohazalaringizni yozing..."
                  className="w-full h-80 p-4 border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {lastSaved && (
                      <>Oxirgi saqlash: {lastSaved}</>
                    )}
                    {!lastSaved && hasEntry && (
                      <>Bu kunning qaydlari bor</>
                    )}
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Calendar & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sizning Statistikangiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Jami qaydlar</p>
                <p className="text-2xl font-bold">{allEntries.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kumush tangalar</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{user?.silverCoins || 0}</p>
                  <Coins className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Yaqinda Yozilgan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allEntries.slice(0, 10).map((entry) => (
                  <button
                    key={entry.date}
                    onClick={() => {
                      const [year, month, day] = entry.date.split('-');
                      setSelectedDate(startOfDay(new Date(parseInt(year), parseInt(month) - 1, parseInt(day))));
                    }}
                    className={`w-full text-left p-2 rounded-md text-sm transition ${
                      selectedDate.toDateString() === new Date(entry.date).toDateString()
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">{format(new Date(entry.date), 'MMM d')}</div>
                    <div className="text-xs truncate opacity-75">
                      {entry.content.substring(0, 30)}...
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">💡 Maslahat</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• Har kuni daftari yozish uchun 1 kumush tanga oling</p>
              <p>• Sizning kunlik fikr-mulohazalaringizni qayd qiling</p>
              <p>• Kundan kuniga o'tirib, o'zingizning rivojlanishni ko'ring</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
