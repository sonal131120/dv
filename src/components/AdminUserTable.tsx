import React, { useState } from "react";
import {
  Users,
  Eye,
  Trash2,
  Search,
  Download,
  Calendar,
  Mail,
  UserCheck,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  last_login: string | null;
  avatar_url: string | null;
  role: string;
}

interface AdminUserTableProps {
  users: User[];
  onDeleteUser: (
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onExportCSV: (data: any[], filename: string) => void;
}

export const AdminUserTable: React.FC<AdminUserTableProps> = ({
  users,
  onDeleteUser,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof User>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredUsers = users
    .filter(
      (user) =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`
      )
    ) {
      return;
    }

    for (const userId of selectedUsers) {
      await onDeleteUser(userId);
    }
    setSelectedUsers([]);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Never";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            User Management
          </h2>
          <p className="text-blue-700/80 text-base mt-1">
            Manage all registered users and their accounts
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedUsers.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg shadow hover:scale-105 hover:from-red-600 hover:to-red-800 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedUsers.length})
            </button>
          )}
          <button
            onClick={() => onExportCSV(users, "users-export.csv")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow hover:scale-105 hover:from-blue-600 hover:to-blue-800 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto md:mx-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
        <input
          type="text"
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-blue-50/40 text-blue-900 placeholder:text-blue-400"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-400"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>User</span>
                    <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Email</span>
                    <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Created</span>
                    <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition"
                  onClick={() => handleSort("last_login")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Last Login</span>
                    <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/60 transition">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 shadow"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200 shadow">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-blue-900">
                          {user.name || "Unnamed User"}
                        </p>
                        <p className="text-xs text-blue-400">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-900">
                        {user.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-700">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.last_login ? (
                        <>
                          <UserCheck className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-700">
                            {formatDate(user.last_login)}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-orange-600">Never</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => window.open(`/c/${user.id}`, "_blank")}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const res = await onDeleteUser(user.id);
                          if (res.success) {
                            // Optionally, you could show a toast or notification here
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-blue-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              No Users Found
            </h3>
            <p className="text-blue-600">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No users have registered yet"}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 shadow flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900">
            Showing {filteredUsers.length} of {users.length} users
          </span>
        </div>
        {selectedUsers.length > 0 && (
          <span className="text-sm text-blue-700">
            {selectedUsers.length} selected
          </span>
        )}
      </div>
    </div>
  );
};
