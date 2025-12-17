'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={cn(
        'relative w-9 h-9 rounded-xl',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'transition-colors'
      )}
    >
      <Sun className={cn(
        'h-4 w-4 transition-all',
        resolvedTheme === 'dark' ? 'scale-0 rotate-90' : 'scale-100 rotate-0'
      )} />
      <Moon className={cn(
        'absolute h-4 w-4 transition-all',
        resolvedTheme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
          theme === 'light' 
            ? 'bg-white dark:bg-gray-700 shadow-sm' 
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
          theme === 'dark' 
            ? 'bg-white dark:bg-gray-700 shadow-sm' 
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
          theme === 'system' 
            ? 'bg-white dark:bg-gray-700 shadow-sm' 
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  )
}

