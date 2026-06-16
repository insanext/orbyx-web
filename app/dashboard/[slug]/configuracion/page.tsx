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

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailIsError, setEmailIsError] = useState(false);

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
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setEmailIsError(true);
      setEmailMsg("Error: " + error.message);
    } else {
      setEmailIsError(false);
      setEmailMsg(`Confirmación enviada a ${newEmail}. El cambio aplica al confirmar desde ese correo.`);
      setNewEmail("");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordIsError(true);
      setPasswordMsg("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordIsError(true);
      setPasswordMsg("Mínimo 8 caracteres.");
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
      setPasswordMsg("Contraseña actualizada.");
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
      setInviteMsg(`Invitación enviada a ${inviteEmail}`);
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

  const inp =
    "w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors";

  const card = "rounded-2xl border p-5 mb-4";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-10">

      {/* ── SECCIÓN 1: MI CUENTA ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-main)" }}>
          Mi cuenta
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          Administra tu información personal y seguridad.
        </p>

        {/* Datos personales */}
        <div className={card} style={{ background: "var(--bg-card)", borderColor: "rgba(37,99,235,0.18)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-main)" }}>
            Datos personales
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Nombre</label>
              <input value={name} onChange={e => setName(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Teléfono</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+56 9 1234 5678" className={inp} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Correo actual</label>
              <input value={currentUser?.email ?? ""} disabled className={inp + " cursor-not-allowed opacity-40"} />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {savingProfile ? "Guardando..." : profileMsg === "ok" ? "✓ Guardado" : "Guardar cambios"}
            </button>
            {profileMsg && profileMsg !== "ok" && (
              <p className="text-xs text-red-400">{profileMsg}</p>
            )}
          </div>
        </div>

        {/* Cambiar correo */}
        <div className={card} style={{ background: "var(--bg-card)", borderColor: "rgba(37,99,235,0.18)" }}>
          <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-main)" }}>Cambiar correo</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Recibirás confirmación en el nuevo correo. El cambio aplica solo al confirmar.
          </p>
          <div className="space-y-3">
            <input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              type="email"
              placeholder="Nuevo correo electrónico"
              className={inp}
            />
            <button
              onClick={handleChangeEmail}
              disabled={!newEmail.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-40"
            >
              Enviar confirmación
            </button>
            {emailMsg && (
              <p className={`text-xs ${emailIsError ? "text-red-400" : "text-green-400"}`}>{emailMsg}</p>
            )}
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className={card} style={{ background: "var(--bg-card)", borderColor: "rgba(37,99,235,0.18)" }}>
          <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-main)" }}>Cambiar contraseña</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Ingresa tu contraseña actual para confirmar. Mínimo 8 caracteres.
          </p>
          <div className="space-y-3">
            <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" placeholder="Contraseña actual" className={inp} />
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="Nueva contraseña" className={inp} />
            <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="Confirmar nueva contraseña" className={inp} />
            <button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-40"
            >
              Cambiar contraseña
            </button>
            {passwordMsg && (
              <p className={`text-xs ${passwordIsError ? "text-red-400" : "text-green-400"}`}>{passwordMsg}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: EQUIPO ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-main)" }}>
          Equipo
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          Gestiona quién tiene acceso a tu negocio y con qué permisos.
        </p>

        {/* Usuarios activos */}
        <div className={card} style={{ background: "var(--bg-card)", borderColor: "rgba(37,99,235,0.18)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-main)" }}>Usuarios con acceso</h3>
          {members.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sin usuarios adicionales.</p>
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
                        <option value="admin">Admin</option>
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
        </div>

        {/* Invitaciones pendientes */}
        {invitations.filter(i => i.status === "pending").length > 0 && (
          <div className={card} style={{ background: "var(--bg-card)", borderColor: "rgba(37,99,235,0.18)" }}>
            <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-main)" }}>
              Invitaciones pendientes
            </h3>
            <div>
              {invitations
                .filter(i => i.status === "pending")
                .map(inv => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2.5 border-b last:border-0"
                    style={{ borderColor: "rgba(37,99,235,0.12)" }}
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
                      Cancelar
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Invitar usuario */}
        <div className={card} style={{ background: "var(--bg-card)", borderColor: "rgba(37,99,235,0.18)" }}>
          <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-main)" }}>Invitar usuario</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            El usuario recibirá un correo para acceder al negocio con el rol asignado.
          </p>
          <div className="space-y-3">
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              type="email"
              placeholder="correo@ejemplo.com"
              className={inp}
            />
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Rol</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className={inp}
              >
                <option value="admin">Administrador — acceso completo excepto billing y usuarios</option>
                <option value="branch">Sucursal — solo agenda y clientes de su sucursal</option>
                <option value="readonly">Solo lectura — puede ver pero no editar</option>
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={sendingInvite || !inviteEmail.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-40"
            >
              {sendingInvite ? "Enviando..." : "Enviar invitación"}
            </button>
            {inviteMsg && (
              <p className={`text-xs ${inviteIsError ? "text-red-400" : "text-green-400"}`}>{inviteMsg}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
