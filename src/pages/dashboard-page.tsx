import { useQuery } from '@tanstack/react-query'
import {
  BookOpenCheckIcon,
  BookOpenIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UserIcon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { getCurrentUser } from '@/features/auth/auth-api'
import { useAuth } from '@/features/auth/auth-context'
import { listCourses } from '@/features/courses/course-api'
import { listMyCourses } from '@/features/learning/learning-api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function DashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })

  const user = currentUserQuery.data
  const displayName = user?.displayName || user?.username || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const roles = user?.roles ?? []
  const permissions = user?.permissions ?? []
  const isAdmin = roles.includes('ADMIN')
  const isTeacher = roles.includes('TEACHER')
  const canManageCourses =
    isAdmin ||
    isTeacher ||
    permissions.some((permission) => permission.startsWith('course:'))
  const canLearn = roles.includes('STUDENT')
  const manageLabel = isAdmin
    ? 'Manage all courses'
    : isTeacher
      ? 'Manage my courses'
      : 'Manage courses'
  const managedCoursesLabel = isAdmin
    ? 'All managed courses'
    : isTeacher
      ? 'My managed courses'
      : 'Managed courses'

  const coursesQuery = useQuery({
    queryKey: ['dashboard-courses'],
    queryFn: () => listCourses({ page: 0, size: 1, status: 'ALL' }),
    enabled: canManageCourses,
  })

  const myCoursesQuery = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => listMyCourses(0, 20),
    enabled: canLearn,
  })

  const enrolledCourses = myCoursesQuery.data?.items ?? []
  const recentCourse = enrolledCourses
    .filter((course) => course.lastStudiedAt)
    .sort((left, right) =>
      String(right.lastStudiedAt).localeCompare(String(left.lastStudiedAt)),
    )[0]

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">Learning Platform</h1>
            <p className="text-sm text-muted-foreground">User workspace</p>
          </div>
          <div className="flex items-center gap-2">
            {canLearn ? (
              <Button variant="ghost" asChild>
                <Link to="/learn/courses">
                  <BookOpenIcon />
                  Catalog
                </Link>
              </Button>
            ) : null}
            {canManageCourses ? (
              <Button variant="ghost" asChild>
                <Link to="/courses">
                  <ShieldCheckIcon />
                  {manageLabel}
                </Link>
              </Button>
            ) : null}
            {canLearn ? (
              <Button variant="ghost" asChild>
                <Link to="/me/courses">
                  <BookOpenCheckIcon />
                  My courses
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" onClick={handleLogout}>
              <LogOutIcon />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current user</CardTitle>
            <CardDescription>Loaded from /api/v1/users/me.</CardDescription>
          </CardHeader>
          <CardContent>
            {currentUserQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            ) : currentUserQuery.isError ? (
              <p className="text-sm text-destructive">Unable to load current user.</p>
            ) : user ? (
              <div className="flex items-start gap-3">
                <Avatar size="lg">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={displayName} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium">{displayName}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{user.status}</Badge>
                    <Badge variant="secondary">@{user.username}</Badge>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              label={managedCoursesLabel}
              value={canManageCourses ? coursesQuery.data?.total ?? 0 : '—'}
              href="/courses"
            />
            <SummaryCard
              label="Enrolled courses"
              value={canLearn ? myCoursesQuery.data?.total ?? 0 : '—'}
              href="/me/courses"
            />
            <SummaryCard
              label="Recent learning"
              value={recentCourse ? `${Math.round(recentCourse.completionRate * 100)}%` : '—'}
              description={recentCourse?.title ?? 'No recent progress'}
              href={recentCourse ? `/learn/courses/${recentCourse.courseId}` : '/learn/courses'}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4" />
                Roles
              </CardTitle>
              <CardDescription>Backend roles assigned to the signed-in user.</CardDescription>
            </CardHeader>
            <CardContent>
              <TokenList values={user?.roles} emptyText="No roles returned." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="size-4" />
                Permissions
              </CardTitle>
              <CardDescription>Authorities available for frontend route decisions.</CardDescription>
            </CardHeader>
            <CardContent>
              <TokenList values={user?.permissions} emptyText="No permissions returned." />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
  description,
  href,
}: {
  label: string
  value: number | string
  description?: string
  href: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" asChild>
          <Link to={href}>{description ?? 'Open'}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function TokenList({
  values,
  emptyText,
}: {
  values: string[] | undefined
  emptyText: string
}) {
  if (!values?.length) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} variant="outline">
          {value}
        </Badge>
      ))}
    </div>
  )
}
