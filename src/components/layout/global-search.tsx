'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Shield, User } from 'lucide-react';
import { Input } from '../ui/input';
import { performSearch } from '@/lib/data';
import type { User as UserType, Group } from '@/lib/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useDebounce } from '@/hooks/use-debounce';
import { Link } from '@/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{ users: UserType[], groups: Group[] }>({ users: [], groups: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const handleSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults({ users: [], groups: [] });
      setIsOpen(false);
      return;
    }
    setLoading(true);
    setIsOpen(true);
    try {
      const searchResults = await performSearch(term);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, handleSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            setIsOpen(prev => !prev);
        }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasResults = results.users.length > 0 || results.groups.length > 0;

  return (
    <div className="relative flex-1 md:grow-0">
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search users or groups..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {if(searchTerm) setIsOpen(true)}}
            />
             <kbd className="pointer-events-none absolute right-2.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
            </kbd>
        </div>
      {isOpen && (
        <>
            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsOpen(false)}></div>
            <CommandList className="absolute top-12 z-50 w-full md:w-[320px] rounded-md border bg-popover text-popover-foreground shadow-md">
                {loading && <CommandEmpty>Loading...</CommandEmpty>}
                {!loading && !hasResults && debouncedSearchTerm.length > 1 && <CommandEmpty>No results found.</CommandEmpty>}
                
                {results.users.length > 0 && (
                    <CommandGroup heading="Users">
                        {results.users.map(user => (
                            <Link key={user.id} href={{pathname: '/profile/[id]', params: {id: user.id}}} onClick={() => setIsOpen(false)}>
                                <CommandItem>
                                    <Avatar className="mr-2 h-6 w-6">
                                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                                        <AvatarFallback>{user.firstName?.charAt(0) ?? ''}</AvatarFallback>
                                    </Avatar>
                                    <span>{user.fullName}</span>
                                </CommandItem>
                            </Link>
                        ))}
                    </CommandGroup>
                )}

                {results.groups.length > 0 && (
                     <CommandGroup heading="Groups">
                        {results.groups.map(group => (
                             <Link key={group.id} href={{pathname: '/groups/[id]', params: {id: group.id}}} onClick={() => setIsOpen(false)}>
                                <CommandItem>
                                     <div className="mr-2 h-6 w-6 rounded-sm overflow-hidden relative">
                                        <Image src={group.imageUrl} alt={group.name} fill className='object-cover' />
                                    </div>
                                    <span>{group.name}</span>
                                </CommandItem>
                            </Link>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </>
      )}
    </div>
  );
}
