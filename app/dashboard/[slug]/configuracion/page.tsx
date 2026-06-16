"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

const ROLE_LABEL: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  branch: "Sucursal",
  readonly: "Solo lectura",
};

export default function ConfiguracionPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<1 | 2>(1);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailIsError, setEmailIsError] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordIsError, setPasswordIsError] = useState(false);

  const [tenantId, setTenantId] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteIsError, setInviteIsError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      setName(user.user_metadata?.name ?? "");
      setPhone(user.user_metadata?.phone ?? "");

      const res = await fetch(`${BACKEND_URL}/public/business/${slug}`);
      const data = await res.json();
      const tid = data?.business?.id;
      if (tid) {
        setTenantId(tid);
        loadTeam(tid);
      }
    };
    if (slug) load();
  }, [slug]);

  const loadTeam = async (tid: string) => {
    const [mRes, iRes] = await Promise.all([
      fetch(`${BACKEND_URL}/members?tenant_id=${tid}`),
      fetch(`${BACKEND_URL}/invitations?tenant_id=${tid}`),
    ]);
    const mData = await mRes.json();
    const iData = await iRes.json();
    setMembers(mData.members ?? []);
    setInvitations(iData.invitations ?? []);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg("");
    const { error } = await supabase.auth.updateUser({ data: { name, phone } });
    setSavingProfile(false);
    if (error) {
      setProfileMsg("Error: " + error.message);
    } else {
      setProfileMsg("ok");
      setTimeout(() => setProfileMsg(""), 2500);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    const target = newEmail.trim();
    const { error } = await supabase.auth.updateUser({ email: target });
    if (error) {
      setEmailIsError(true);
      setEmailMsg("Error: " + error.message);
    } else {
      setEmailSentTo(target);
      setEmailSent(true);
      setNewEmail("");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordIsError(true);
      setPasswordMsg("Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordIsError(true);
      setPasswordMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });
    if (signInErr) {
      setPasswordIsError(true);
      setPasswordMsg("La contraseña actual es incorrecta.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordIsError(true);
      setPasswordMsg("Error: " + error.message);
    } else {
      setPasswordIsError(false);
      setPasswordMsg("✓ Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg(""), 3000);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !tenantId) return;
    setSendingInvite(true);
    setInviteMsg("");
    try {
      const res = await fetch(`${BACKEND_URL}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          email: inviteEmail,
          role: inviteRole,
          invited_by: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar invitación");
      setInviteIsError(false);
      setInviteMsg(`✓ Invitación enviada a ${inviteEmail}`);
      setInviteEmail("");
      loadTeam(tenantId);
    } catch (e: any) {
      setInviteIsError(true);
      setInviteMsg(e.message);
    } finally {
      setSendingInvite(false);
      setTimeout(() => setInviteMsg(""), 4000);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    await fetch(`${BACKEND_URL}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, role: newRole }),
    });
    loadTeam(tenantId);
  };

  const handleRevoke = async (memberId: string) => {
    if (!confirm("¿Revocar acceso a este usuario?")) return;
    await fetch(`${BACKEND_URL}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, is_active: false }),
    });
    loadTeam(tenantId);
  };

  const handleCancelInvite = async (inviteId: string) => {
    await fetch(`${BACKEND_URL}/invitations/${inviteId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId }),
    });
    loadTeam(tenantId);
  };

  const inp = "w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors";
  const card = "rounded-2xl border p-5 mb-4";
  const cardStyle = { background: "var(--bg-card)", borderColor: "rgba(37,99,235,0.18)" };
  const label = "text-xs mb-1.5 block font-medium";
  const btn = "px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-40";

  const TABS = [
    { tab: 1 as const, number: "1", title: "Mi cuenta", description: "Perfil y seguridad" },
    { tab: 2 as const, number: "2", title: "Equipo", description: "Accesos y permisos" },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* ── TABS ── */}
      <section
        className="overflow-hidden rounded-2xl border p-1"
        style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
      >
        <div className="grid gap-1 grid-cols-2">
          {TABS.map(t => (
            <button
              key={t.tab}
              type="button"
              onClick={() => setActiveTab(t.tab)}
              aria-current={activeTab === t.tab ? "step" : undefined}
              className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:border-blue-400/40 hover:bg-[rgba(37,99,235,0.07)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                activeTab === t.tab ? "orbyx-campaign-energy-active" : ""
              }`}
              style={{
                borderColor: activeTab === t.tab ? "rgba(37,99,235,0.55)" : "transparent",
                background: activeTab === t.tab
                  ? "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(14,165,233,0.08))"
                  : "transparent",
                boxShadow: activeTab === t.tab ? "inset 0 0 0 1px rgba(37,99,235,0.22)" : "none",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: activeTab === t.tab
                    ? "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))"
                    : "var(--bg-soft)",
                  color: activeTab === t.tab ? "#ffffff" : "var(--text-muted)",
                }}
              >
                {t.number}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                  {t.title}
                </p>
                <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                  {t.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── TAB 1: MI CUENTA ── */}
      {activeTab === 1 && (
        <div className="space-y-4">

          {/* Bloque 1: Datos personales */}
          <div className={card} style={cardStyle}>
            <h3 className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-main)" }}>
              Datos personales
            </h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Tu nombre y teléfono visibles en el sistema.
            </p>
            <div className="space-y-3">
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Nombre</label>
                <input value={name} onChange={e => setName(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Teléfono</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+56 9 1234 5678" className={inp} />
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>
                  Correo actual
                  <span className="ml-1.5 text-blue-400/60">🔒</span>
                </label>
                <input value={currentUser?.email ?? ""} disabled className={inp + " cursor-not-allowed opacity-40"} />
              </div>
              <button onClick={handleSaveProfile} disabled={savingProfile} className={btn}>
                {savingProfile ? "Guardando..." : profileMsg === "ok" ? "✓ Guardado" : "Guardar cambios"}
              </button>
              {profileMsg && profileMsg !== "ok" && (
                <p className="text-xs text-red-400">{profileMsg}</p>
              )}
            </div>
          </div>

          {/* Bloque 2: Cambiar correo */}
          <div className={card} style={cardStyle}>
            <h3 className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-main)" }}>
              Cambiar correo electrónico
            </h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Tu correo actual es{" "}
              <span style={{ color: "var(--text-main)" }}>{currentUser?.email ?? "…"}</span>.
              {" "}Para cambiarlo, escribe el nuevo correo y solicita el cambio. Te enviaremos un email al nuevo
              correo con un link de confirmación. El cambio solo se aplica cuando hagas clic en ese link —
              tu correo actual sigue funcionando hasta entonces.
            </p>

            {emailSent ? (
              <div className="rounded-xl border border-green-500/30 bg-green-500/8 px-4 py-3 text-sm text-green-400">
                ✓ Enviamos un email a <strong>{emailSentTo}</strong>. Ábrelo y haz clic en el link para
                confirmar el cambio. Si no lo ves, revisa tu carpeta de spam.
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className={label} style={{ color: "var(--text-muted)" }}>Nuevo correo electrónico</label>
                  <input
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    type="email"
                    placeholder="nuevo@correo.com"
                    className={inp}
                  />
                </div>
                <button onClick={handleChangeEmail} disabled={!newEmail.trim()} className={btn}>
                  Solicitar cambio de correo
                </button>
                {emailMsg && (
                  <p className={`text-xs ${emailIsError ? "text-red-400" : "text-green-400"}`}>{emailMsg}</p>
                )}
              </div>
            )}
          </div>

          {/* Bloque 3: Cambiar contraseña */}
          <div className={card} style={cardStyle}>
            <h3 className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-main)" }}>
              Cambiar contraseña
            </h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Para cambiar tu contraseña debes ingresar primero la contraseña actual.
              La nueva contraseña debe tener al menos 8 caracteres.
            </p>
            <div className="space-y-3">
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Contraseña actual</label>
                <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" className={inp} />
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Nueva contraseña</label>
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" className={inp} />
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Repetir nueva contraseña</label>
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" className={inp} />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
                className={btn}
              >
                Actualizar contraseña
              </button>
              {passwordMsg && (
                <p className={`text-xs ${passwordIsError ? "text-red-400" : "text-green-400"}`}>{passwordMsg}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EQUIPO ── */}
      {activeTab === 2 && (
        <div className="space-y-4">

          {/* Bloque 1: Usuarios con acceso */}
          <div className={card} style={cardStyle}>
            <h3 className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-main)" }}>
              Usuarios con acceso
            </h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Personas que pueden entrar al dashboard de tu negocio.
            </p>

            {members.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Solo tú tienes acceso por ahora.</p>
            ) : (
              <div>
                {members.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2.5 border-b last:border-0"
                    style={{ borderColor: "rgba(37,99,235,0.12)" }}
                  >
                    <div>
                      <p className="text-sm" style={{ color: "var(--text-main)" }}>{m.email ?? "—"}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ROLE_LABEL[m.role] ?? m.role}</p>
                    </div>
                    {m.role === "owner" ? (
                      <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        Propietario
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={m.role}
                          onChange={e => handleChangeRole(m.id, e.target.value)}
                          className="text-xs rounded-lg border px-2 py-1 focus:outline-none"
                          style={{ borderColor: "rgba(37,99,235,0.3)" }}
                        >
                          <option value="admin">Administrador</option>
                          <option value="branch">Sucursal</option>
                          <option value="readonly">Solo lectura</option>
                        </select>
                        <button
                          onClick={() => handleRevoke(m.id)}
                          className="text-xs px-2 py-1 rounded-lg border border-transparent hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-colors"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Revocar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Invitaciones pendientes (debajo de la lista) */}
            {invitations.filter(i => i.status === "pending").length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(37,99,235,0.12)" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                  Invitaciones pendientes
                </p>
                {invitations
                  .filter(i => i.status === "pending")
                  .map(inv => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                      style={{ borderColor: "rgba(37,99,235,0.08)" }}
                    >
                      <div>
                        <p className="text-sm" style={{ color: "var(--text-main)" }}>{inv.email}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ROLE_LABEL[inv.role] ?? inv.role}</p>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(inv.id)}
                        className="text-xs px-2 py-1 rounded-lg border border-transparent hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-colors"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Cancelar invitación
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Bloque 2: Invitar usuario */}
          <div className={card} style={cardStyle}>
            <h3 className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-main)" }}>
              Invitar a alguien
            </h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Recibirá un correo con acceso al dashboard según el rol que le asignes.
            </p>
            <div className="space-y-3">
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Correo electrónico</label>
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className={inp}
                />
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Rol</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className={inp}
                >
                  <option value="admin">Administrador — acceso completo excepto billing y usuarios</option>
                  <option value="branch">Sucursal — solo agenda y clientes de su sucursal</option>
                  <option value="readonly">Solo lectura — puede ver pero no modificar nada</option>
                </select>
              </div>
              <button
                onClick={handleInvite}
                disabled={sendingInvite || !inviteEmail.trim()}
                className={btn}
              >
                {sendingInvite ? "Enviando..." : "Enviar invitación"}
              </button>
              {inviteMsg && (
                <p className={`text-xs ${inviteIsError ? "text-red-400" : "text-green-400"}`}>{inviteMsg}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
