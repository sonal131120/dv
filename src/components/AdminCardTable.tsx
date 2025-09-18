import React, { useState } from "react";
import {
  CreditCard,
  Eye,
  Trash2,
  Search,
  Download,
  ToggleLeft,
  ToggleRight,
  Calendar,
  User,
  Building,
  BarChart3,
  ArrowUpDown,
} from "lucide-react";

interface BusinessCard {
  id: string;
  title: string | null;
  company: string | null;
  is_published: boolean;
  updated_at: string;
  user_id: string;
  slug: string | null;
  view_count: number;
  profiles: {
    name: string | null;
    email: string | null;
  };
}

interface AdminCardTableProps {
  cards: BusinessCard[];
  onToggleCardStatus: (
    cardId: string,
    currentStatus: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteCard: (
    cardId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onExportCSV: (data: any[], filename: string) => void;
}

export const AdminCardTable: React.FC<AdminCardTableProps> = ({
  cards,
  onToggleCardStatus,
  onDeleteCard,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof BusinessCard>("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");

  const filteredCards = cards
    .filter((card) => {
      const matchesSearch =
        card.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.profiles?.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        card.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && card.is_published) ||
        (statusFilter === "draft" && !card.is_published);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: keyof BusinessCard) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSelectCard = (cardId: string) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCards.length === filteredCards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredCards.map((card) => card.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCards.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedCards.length} cards? This action cannot be undone.`
      )
    ) {
      return;
    }

    for (const cardId of selectedCards) {
      await onDeleteCard(cardId);
    }
    setSelectedCards([]);
  };

  const handleBulkToggleStatus = async () => {
    if (selectedCards.length === 0) return;

    for (const cardId of selectedCards) {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        await onToggleCardStatus(cardId, card.is_published);
      }
    }
    setSelectedCards([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md mx-auto md:mx-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cards by title, company, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "published" | "draft")
          }
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 text-gray-900"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Cards Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-white border-b border-green-400">
              <tr className="bg-green-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedCards.length === filteredCards.length &&
                      filteredCards.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-green-300 text-green-600 focus:ring-green-400 w-4 h-4"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider cursor-pointer hover:bg-green-200 transition"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Card</span>
                    <ArrowUpDown className="w-4 h-4 text-green-600" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider cursor-pointer hover:bg-green-200 transition"
                  onClick={() => handleSort("profiles")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Owner</span>
                    <ArrowUpDown className="w-4 h-4 text-green-600" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider cursor-pointer hover:bg-green-200 transition"
                  onClick={() => handleSort("view_count")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Views</span>
                    <ArrowUpDown className="w-4 h-4 text-green-600" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider cursor-pointer hover:bg-green-200 transition"
                  onClick={() => handleSort("updated_at")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Updated</span>
                    <ArrowUpDown className="w-4 h-4 text-green-600" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-green-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-blue-100 transition">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes(card.id)}
                      onChange={() => handleSelectCard(card.id)}
                      className="rounded border-green-300 text-green-600 focus:ring-green-400 w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200 shadow">
                        <CreditCard className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {card.title || "Untitled Card"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {card.company || "No company"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {card.profiles?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {card.profiles?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-bold shadow ${
                        card.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {card.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-900">
                        {card.view_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-700">
                        {formatDate(card.updated_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => window.open(`/c/${card.slug}`, "_blank")}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Card"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={async () => {
                          await onToggleCardStatus(card.id, card.is_published);
                        }}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                        title={card.is_published ? "Unpublish" : "Publish"}
                      >
                        {card.is_published ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          await onDeleteCard(card.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-green-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              No Cards Found
            </h3>
            <p className="text-green-600">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No business cards have been created yet"}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 shadow flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-900">
            Showing {filteredCards.length} of {cards.length} cards
          </span>
        </div>
        {selectedCards.length > 0 && (
          <span className="text-sm text-green-700">
            {selectedCards.length} selected
          </span>
        )}
      </div>
    </div>
  );
};
