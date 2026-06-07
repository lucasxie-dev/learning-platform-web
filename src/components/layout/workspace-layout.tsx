import {
  BookOpenCheckIcon,
  BookOpenIcon,
  ChevronDownIcon,
  FileTextIcon,
  GraduationCapIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import type { CurrentUser } from '@/features/auth/types'
import { useAuth } from '@/features/auth/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type WorkspaceLayoutProps = {
  user: CurrentUser | undefined
  title: string
  description: string
  activeItem: 'dashboard' | 'courses' | 'lessons' | 'media' | 'catalog' | 'my-courses' | 'settings'
  canManageCourses: boolean
  canLearn: boolean
  manageLabel: string
  lessonsHref?: string
  children: React.ReactNode
}

export function WorkspaceLayout({
  user,
  title,
  description,
  activeItem,
  canManageCourses,
  canLearn,
  manageLabel,
  children,
}: WorkspaceLayoutProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const displayName = user?.displayName || user?.username || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-svh bg-[#f8fbff] text-slate-950">
      <div className="grid min-h-svh xl:grid-cols-[300px_1fr]">
        <aside className="hidden border-r border-slate-200/80 bg-white px-5 py-8 xl:flex xl:flex-col">
          <Link className="flex items-center gap-3 px-2" to="/dashboard">
            <BrandMark />
            <span className="text-xl font-bold tracking-tight">Learning Platform</span>
          </Link>

          <nav className="mt-12 grid gap-2 text-[15px] font-medium text-slate-600">
            <NavItem
              active={activeItem === 'dashboard'}
              icon={<LayoutDashboardIcon />}
              label="Dashboard"
              to="/dashboard"
            />
            {canManageCourses ? (
              <>
                <NavItem
                  active={activeItem === 'courses'}
                  icon={<GraduationCapIcon />}
                  label={manageLabel}
                  to="/courses"
                />
                <NavItem
                  active={activeItem === 'lessons'}
                  icon={<FileTextIcon />}
                  label="Lessons"
                  to="/app/lessons"
                />
                <NavItem
                  active={activeItem === 'media'}
                  icon={<ImageIcon />}
                  label="Media Assets"
                  to="/app/media-assets"
                />
              </>
            ) : null}
            {canLearn ? (
              <>
                <NavItem
                  active={activeItem === 'catalog'}
                  icon={<BookOpenIcon />}
                  label="Course Catalog"
                  to="/learn/courses"
                />
                <div className="my-4 h-px bg-slate-200" />
                <NavItem
                  active={activeItem === 'my-courses'}
                  icon={<BookOpenCheckIcon />}
                  label="My Courses"
                  to="/me/courses"
                />
              </>
            ) : null}
            <NavItem
              active={activeItem === 'settings'}
              icon={<SettingsIcon />}
              label="Settings"
              to="/app/settings"
            />
          </nav>

          <div className="mt-auto rounded-3xl border border-blue-100 bg-gradient-to-b from-white to-blue-50 p-6 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-3xl bg-blue-100 text-blue-600">
              <GraduationCapIcon className="size-10" />
            </div>
            <h3 className="font-bold">Advanced features</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Reporting, custom branding, and support workflows are available for private
              deployments.
            </p>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-7 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-12 items-center gap-2 rounded-2xl bg-white px-2.5 shadow-[0_12px_36px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 transition hover:bg-slate-50">
                    <Avatar>
                      {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={displayName} /> : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <ChevronDownIcon className="size-4 text-slate-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                  <DropdownMenuItem className="cursor-pointer gap-2 px-3 py-2" onClick={handleLogout}>
                    <LogOutIcon className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  )
}

function BrandMark() {
  return (
    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]">
      <BookOpenIcon className="size-6" />
    </div>
  )
}

function NavItem({
  active,
  icon,
  label,
  to,
}: {
  active?: boolean
  icon: React.ReactNode
  label: string
  to: string
}) {
  return (
    <Link
      className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition ${
        active
          ? 'bg-blue-50 text-blue-600 shadow-[0_12px_32px_rgba(37,99,235,0.08)]'
          : 'hover:bg-slate-50 hover:text-blue-600'
      }`}
      to={to}
    >
      <span className="[&>svg]:size-6">{icon}</span>
      {label}
    </Link>
  )
}
