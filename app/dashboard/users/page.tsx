"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, Search, Trash2, Users } from "lucide-react"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import {
  adminGetUserSummary,
} from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import { useAppDispatch, useAppSelector, selectUsers, selectUsersLoading, selectUsersError, selectUsersPagination, selectUsersDeleting } from "@/lib/store"
import { fetchUsers, deleteUser, optimisticRemove } from "@/lib/store/users-slice"
import type { User, PaginatedResponse, UserSummary } from "@/lib/types"
import { toast } from "sonner"

export default function AdminUsersPage() {
  const router = useRouter()
  const { user: me, loading: authLoading } = useAuth()
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectUsers)
  const loading = useAppSelector(selectUsersLoading)
  const loadError = useAppSelector(selectUsersError)
  const pagination = useAppSelector(selectUsersPagination)
  const deletingIds = useAppSelector(selectUsersDeleting)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data: summary } = useApi<UserSummary>(() => adminGetUserSummary(), [])

  // Load users when search/page changes
  useEffect(() => {
    dispatch(fetchUsers({ search, page, per_page: 20 }))
  }, [dispatch, search, page])

  useEffect(() => {
    if (!authLoading && !me) router.replace("/login")
  }, [authLoading, me, router])

  useEffect(() => {
    if (!authLoading && me && me.role !== "admin") router.replace("/profile")
  }, [authLoading, me, router])

  async function handleDelete(userId: number, userName: string) {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    // Optimistic remove
    dispatch(optimisticRemove(userId))
    try {
      await dispatch(deleteUser(userId)).unwrap()
      toast.success("User deleted")
    } catch (err) {
      // Reload on error to restore state
      dispatch(fetchUsers({ search, page, per_page: 20 }))
      toast.error(getApiErrorMessage(err, "Failed to delete user"))
    }
  }

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {items ? `${pagination.total} registered users` : "Manage your customers"}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-semibold">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Total users</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-semibold">{summary.clients}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-semibold">{summary.admins}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-semibold">{summary.new_this_month}</p>
              <p className="text-xs text-muted-foreground">New this month</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mt-6">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : loadError ? (
          <StateMessage icon={<AlertCircle className="size-6" />} title={loadError} action={<Button onClick={() => dispatch(fetchUsers({ search, page, per_page: 20 }))} variant="outline">Try again</Button>} />
        ) : !items || items.length === 0 ? (
          <StateMessage
            icon={<Users className="size-6" />}
            title="No users found"
            description={search ? "Try a different search term." : "No users registered yet."}
          />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Orders</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                          {u.first_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {u.first_name} {u.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(u as any).orders_count ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {me?.id !== u.id && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)}
                          className="text-destructive hover:text-destructive"
                          disabled={deletingIds.includes(u.id)}
                        >
                          {deletingIds.includes(u.id) ? "..." : <Trash2 className="size-3.5" />}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination simple currentPage={page} lastPage={pagination.lastPage} onPageChange={setPage} />
      </div>
  )
}
