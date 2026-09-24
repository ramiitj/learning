import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="cover">
      <h1 className="cover__headline">404</h1>
      <p><Link href="/">←</Link></p>
    </div>
  );
}
