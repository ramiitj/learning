/** Console modules that are views rather than collections. */
export function NavLinks() {
  const links = [
    ["/console/command", "Command channel"],
    ["/console/translations", "Translation review"],
    ["/console/analytics", "Analytics"],
    ["/console/components", "Component registry"],
  ];
  return (
    <nav aria-label="Console modules" style={{ display: "grid", gap: 6, padding: "12px 0" }}>
      {links.map(([href, label]) => (
        <a key={href} href={href} className="nav__link">
          {label}
        </a>
      ))}
    </nav>
  );
}
