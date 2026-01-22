import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Folder, FileText } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
const SearchPage = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     SEARCH API
  ========================= */
  const handleSearch = async (value) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      const res = await fetch(
        `http://localhost:5000/api/search?q=${encodeURIComponent(value)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setResults(data || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };
  const handleClick = (item) => {
      const type = item.type?.toUpperCase();
  if (type === "PROJECT") {
    navigate(`/workspace/${item.workspace_slug}/project/${item.id}`);
  }

  if (type === "TASK") {
    navigate(
      `/workspace/${item.workspace_slug}/project/${item.project_id}`,
      {
        state: { highlightTaskId: item.id }
      }
    );
  }
};
  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "project":
        return Folder;
      case "task":
      default:
        return FileText;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "project":
        return "bg-accent/20 text-accent";
      case "task":
        return "bg-primary/20 text-primary";
      default:
        return "bg-secondary/20 text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 md:px-6 py-8">
        {/* 🔙 Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* 🔍 Header */}
        <div className="flex items-center gap-3 mb-8">
          <Search className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">
            Global Search
          </h1>
        </div>

        {/* 🔎 Search Input */}
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks, projects, or workspaces..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-secondary/50 border border-border rounded-xl text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              autoFocus
            />
          </div>

          {query && (
            <p className="mt-4 text-sm text-muted-foreground">
              {loading
                ? "Searching..."
                : `Found ${results.length} results for "${query}"`}
            </p>
          )}
        </div>

        {/* 📄 Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => {
              const Icon = getIcon(result.type);

              return (
                <div
                  key={index}
                   onClick={() => handleClick(result)}
                  className="glass-card p-4 hover-lift cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                 
                >
                
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`icon-box ${getTypeColor(result.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {result.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {result.workspace}
                      </p>
                    </div>

                    {/* Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        result.type
                      )}`}
                    >
                      {result.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ❌ No Results */}
        {query && !loading && results.length === 0 && (
          <div className="glass-card p-12 text-center animate-fade-in">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No results found
            </h3>
            <p className="text-muted-foreground">
              Try different keywords
            </p>
          </div>
        )}

        {/* 🌱 Initial State */}
        {!query && (
          <div className="glass-card p-12 text-center animate-fade-in">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Search across everything
            </h3>
            <p className="text-muted-foreground">
              Find tasks, projects, and workspaces instantly
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
