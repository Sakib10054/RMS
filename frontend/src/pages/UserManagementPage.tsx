
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CheckCircle2,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Users,
    UserCheck,
    UserX,
    X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
    userService,
    type ManagedUser,
    type CreateUserRequest,
} from "../services/userService";
import type { UserRole } from "../types/auth";

type Filter = "ALL" | UserRole | "ACTIVE" | "INACTIVE";

const roleStyles: Record<UserRole, string> = {
    MANAGER: "bg-purple-100 text-purple-700",
    STAFF: "bg-blue-100 text-blue-700",
    CUSTOMER: "bg-gray-100 text-gray-700",
};

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Something went wrong.";
}

function SummaryCard({
                         title,
                         value,
                         icon: Icon,
                         color,
                     }: {
    title: string;
    value: number;
    icon: typeof Users;
    color: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {value}
                    </p>
                </div>
                <div className={`rounded-xl p-3 ${color}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

const initialUserForm: CreateUserRequest = {
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "STAFF",
};

export default function UserManagementPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("ALL");
    const [pageError, setPageError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUser, setNewUser] =
        useState<CreateUserRequest>(initialUserForm);

    const {
        data: users = [],
        isLoading,
        isError,
        error,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["managed-users"],
        queryFn: userService.getAll,
        enabled: user?.role === "MANAGER",
    });

    const updateMutation = useMutation({
        mutationFn: ({
                         userId,
                         role,
                         active,
                     }: {
            userId: number;
            role: UserRole;
            active: boolean;
        }) => userService.updateAccess(userId, { role, active }),

        onSuccess: async (_updatedUser, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ["managed-users"],
            });
            setPageError("");
            setSuccessMessage(
                `User #${variables.userId} updated successfully.`,
            );
        },

        onError: (err) => {
            setSuccessMessage("");
            setPageError(errorMessage(err));
        },
    });

    const createMutation = useMutation({
        mutationFn: (userData: CreateUserRequest) =>
            userService.create(userData),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["managed-users"],
            });

            setPageError("");
            setSuccessMessage("New user created successfully.");
            setNewUser(initialUserForm);
            setShowCreateForm(false);
        },

        onError: (err) => {
            setSuccessMessage("");
            setPageError(errorMessage(err));
        },
    });

    const activeCount = users.filter((item) => item.active).length;
    const inactiveCount = users.length - activeCount;
    const managerCount = users.filter(
        (item) => item.role === "MANAGER",
    ).length;

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();

        return users.filter((item) => {
            const matchesSearch =
                !term ||
                String(item.id).includes(term) ||
                item.name.toLowerCase().includes(term) ||
                item.email.toLowerCase().includes(term) ||
                (item.phone ?? "").toLowerCase().includes(term);

            const matchesFilter =
                filter === "ALL" ||
                filter === item.role ||
                (filter === "ACTIVE" && item.active) ||
                (filter === "INACTIVE" && !item.active);

            return matchesSearch && matchesFilter;
        });
    }, [users, search, filter]);

    const updateUser = (
        target: ManagedUser,
        role: UserRole,
        active: boolean,
    ) => {
        if (target.id === user?.userId) {
            setPageError(
                "You cannot change your own role or active status here.",
            );
            return;
        }

        if (target.role === role && target.active === active) return;

        const message =
            `Update access for ${target.name}?\n\n` +
            `Role: ${target.role} → ${role}\n` +
            `Status: ${target.active ? "Active" : "Inactive"} → ${
                active ? "Active" : "Inactive"
            }`;

        if (window.confirm(message)) {
            setPageError("");
            setSuccessMessage("");
            updateMutation.mutate({
                userId: target.id,
                role,
                active,
            });
        }
    };

    const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setPageError("");
        setSuccessMessage("");

        createMutation.mutate({
            ...newUser,
            name: newUser.name.trim(),
            email: newUser.email.trim(),
            phone: newUser.phone?.trim() || "",
        });
    };

    const handleFormChange = (
        field: keyof CreateUserRequest,
        value: string,
    ) => {
        setNewUser((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    if (user?.role !== "MANAGER") {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                    <h1 className="font-semibold">Access Denied</h1>
                    <p className="mt-1 text-sm">
                        Only Managers can access User Management.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        User Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        View users and manage their roles and account access.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setShowCreateForm((previous) => !previous);
                            setPageError("");
                            setSuccessMessage("");
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        {showCreateForm ? <X size={17} /> : <Plus size={17} />}
                        {showCreateForm ? "Close Form" : "Create New User"}
                    </button>

                    <button
                        type="button"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={17}
                            className={isFetching ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Messages */}
            {pageError && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {pageError}
                </div>
            )}

            {successMessage && (
                <div
                    role="status"
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                    {successMessage}
                </div>
            )}

            {/* Create User Form */}
            {showCreateForm && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Create New User
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Enter the new user's details and assign a role.
                        </p>
                    </div>

                    <form
                        onSubmit={handleCreateUser}
                        className="space-y-4"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="new-user-name"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="new-user-name"
                                    type="text"
                                    value={newUser.name}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "name",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Enter full name"
                                    required
                                    maxLength={100}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="new-user-email"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="new-user-email"
                                    type="email"
                                    value={newUser.email}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "email",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="user@example.com"
                                    required
                                    maxLength={150}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="new-user-password"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Password
                                </label>
                                <input
                                    id="new-user-password"
                                    type="password"
                                    value={newUser.password}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "password",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="At least 6 characters"
                                    required
                                    minLength={6}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="new-user-phone"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Phone Number
                                    <span className="ml-1 text-gray-400">
                                        (Optional)
                                    </span>
                                </label>
                                <input
                                    id="new-user-phone"
                                    type="tel"
                                    value={newUser.phone ?? ""}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "phone",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="01XXXXXXXXX"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="new-user-role"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    User Role
                                </label>
                                <select
                                    id="new-user-role"
                                    value={newUser.role}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "role",
                                            event.target.value,
                                        )
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="STAFF">Staff</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="CUSTOMER">Customer</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewUser(initialUserForm);
                                    setPageError("");
                                }}
                                disabled={createMutation.isPending}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {createMutation.isPending
                                    ? "Creating..."
                                    : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Total Users"
                    value={users.length}
                    icon={Users}
                    color="bg-blue-50 text-blue-600"
                />
                <SummaryCard
                    title="Managers"
                    value={managerCount}
                    icon={ShieldCheck}
                    color="bg-purple-50 text-purple-600"
                />
                <SummaryCard
                    title="Active Users"
                    value={activeCount}
                    icon={UserCheck}
                    color="bg-green-50 text-green-600"
                />
                <SummaryCard
                    title="Inactive Users"
                    value={inactiveCount}
                    icon={UserX}
                    color="bg-amber-50 text-amber-600"
                />
            </div>

            {/* User Records */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="font-semibold text-gray-900">
                        User Records
                    </h2>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search name, email or ID..."
                                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-64"
                            />
                        </div>

                        <select
                            value={filter}
                            onChange={(event) =>
                                setFilter(event.target.value as Filter)
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        >
                            <option value="ALL">All Users</option>
                            <option value="MANAGER">Managers</option>
                            <option value="STAFF">Staff</option>
                            <option value="CUSTOMER">Customers</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-10 text-center text-sm text-gray-500">
                        Loading users...
                    </div>
                ) : isError ? (
                    <div className="p-10 text-center">
                        <p className="text-sm text-red-600">
                            {errorMessage(error)}
                        </p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="mt-3 text-sm font-semibold text-indigo-600"
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-10 text-center">
                        <CheckCircle2
                            className="mx-auto text-gray-400"
                            size={32}
                        />
                        <p className="mt-3 font-medium text-gray-800">
                            No users found
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            No users match your search or filter.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-5 py-3">User</th>
                                <th className="px-5 py-3">Phone</th>
                                <th className="px-5 py-3">Role</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">
                                    Access Control
                                </th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((item) => {
                                const isSelf =
                                    item.id === user?.userId;

                                return (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-900">
                                                {item.name}
                                                {isSelf && (
                                                    <span className="ml-2 text-xs font-normal text-gray-400">
                                                            (You)
                                                        </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.email} · ID: {item.id}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 text-gray-600">
                                            {item.phone || "—"}
                                        </td>

                                        <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[item.role]}`}
                                                >
                                                    {item.role}
                                                </span>
                                        </td>

                                        <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        item.active
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {item.active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    aria-label={`Role for ${item.name}`}
                                                    value={item.role}
                                                    disabled={
                                                        isSelf ||
                                                        updateMutation.isPending
                                                    }
                                                    onChange={(event) =>
                                                        updateUser(
                                                            item,
                                                            event.target
                                                                .value as UserRole,
                                                            item.active,
                                                        )
                                                    }
                                                    className="rounded-lg border border-gray-300 px-2 py-2 text-xs disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
                                                >
                                                    <option value="MANAGER">
                                                        Manager
                                                    </option>
                                                    <option value="STAFF">
                                                        Staff
                                                    </option>
                                                    <option value="CUSTOMER">
                                                        Customer
                                                    </option>
                                                </select>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        isSelf ||
                                                        updateMutation.isPending
                                                    }
                                                    onClick={() =>
                                                        updateUser(
                                                            item,
                                                            item.role,
                                                            !item.active,
                                                        )
                                                    }
                                                    className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${
                                                        item.active
                                                            ? "bg-red-600 hover:bg-red-700"
                                                            : "bg-green-600 hover:bg-green-700"
                                                    }`}
                                                >
                                                    {item.active
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-gray-100 px-1 pt-3 text-xs text-gray-500">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>
        </div>
    );
}