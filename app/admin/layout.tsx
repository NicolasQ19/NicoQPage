export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#0a0a0a' }}>
      {children}
    </div>
  );
}
