import Link from "next/link";
import type { Memory } from "../lib/types";

export default function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <Link href={`/memories/${memory.id}`} className="memory-card">
      <div className="memory-card-top">
        <span className="category-pill">{memory.category}</span>
        {memory.is_favorite && <span className="favorite">★</span>}
      </div>
      <h3>{memory.title}</h3>
      <p>{memory.summary || "No summary yet. Open this memory to add context."}</p>
      <div className="memory-meta">
        <span>{memory.source_type}</span>
      <span>
  {new Date(memory.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}
</span>
      </div>
    </Link>
  );
}
