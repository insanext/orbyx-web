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

  // email change (dual-confirmation flow)
  const [emailChangeStatus, setEmailChangeStatus] = useState<{
    pending: boolean;
    new_email?: string;
    old_confirmed?: boolean;
    new_confirmed?: boolean;
    expires_at?: string;
  } | null>(null);
  const [emailChangeLoaded, setEmailChangeLoaded] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailChangePwd, setEmailChangePwd] = useState("");
  const [requestingEmailChange, setRequestingEmailChange] = useState(false);
  const [emailRequestMsg, setEmailRequestMsg] = useState("");
  const [emailRequestIsError, setEmailRequestIsError] = useState(false);

  // revoke modal (TAREA 2)
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; email: string } | null>(null);
  const [revokePwd, setRevokePwd] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeMsg, setRevokeMsg] = useState("");

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
  const [inviteAuthPwd, setInviteAuthPwd] = useState("");
  const [permissions, setPermissions] = useState<Record<string, "edit" | "view" | false>>({
    agenda: false,
    clientes: false,
    campanas: false,
    servicios: false,
    staff: false,
    sucursales: false,
    negocio: false,
  });
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editPermissions, setEditPermissions] = useState<Record<string, "edit" | "view" | false>>({});
  const [editBranchIds, setEditBranchIds] = useState<string[]>([]);
  const [savingUserEdit, setSavingUserEdit] = useState(false);

  const loadEmailChangeStatus = async (uid: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/account/email-change/status?user_id=${uid}`);
      const d = await res.json();
      setEmailChangeStatus(d.pending ? d : { pending: false });
    } catch {
      setEmailChangeStatus({ pending: false });
    } finally {
      setEmailChangeLoaded(true);
    }
  };

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      setName(user.user_metadata?.name ?? "");
      setPhone(user.user_metadata?.phone ?? "");
      loadEmailChangeStatus(user.id);

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

  const handleRequestEmailChange = async () => {
    if (!newEmailInput.trim() || !emailChangePwd) return;
    setRequestingEmailChange(true);
    setEmailRequestMsg("");
    setEmailRequestIsError(false);
    try {
      const res = await fetch(`${BACKEND_URL}/account/email-change/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          current_email: currentUser.email,
          new_email: newEmailInput.trim(),
          password: emailChangePwd,
          tenant_id: tenantId || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Error al solicitar cambio");
      setEmailRequestMsg("✓ " + d.message);
      setNewEmailInput("");
      setEmailChangePwd("");
      await loadEmailChangeStatus(currentUser.id);
    } catch (e: any) {
      setEmailRequestIsError(true);
      setEmailRequestMsg(e.message);
    } finally {
      setRequestingEmailChange(false);
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

  useEffect(() => {
    if (!tenantId) return;
    fetch(`${BACKEND_URL}/branches?tenant_id=${tenantId}`)
      .then(res => res.json())
      .then(data => setBranches(Array.isArray(data?.branches) ? data.branches.filter((b: any) => b.is_active !== false) : []))
      .catch(() => {});
  }, [tenantId]);

  const toggleModule = (module: string) => {
    setPermissions(prev => ({
      ...prev,
      [module]: prev[module] === false ? "view" : false,
    }));
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranchIds(prev =>
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    if (!inviteAuthPwd) {
      setInviteMsg("Debes ingresar tu contraseña para confirmar.");
      return;
    }
    const hasAnyPermission = Object.values(permissions).some(v => v !== false);
    if (!hasAnyPermission) {
      setInviteMsg("Debes dar acceso a al menos un módulo.");
      return;
    }
    setSendingInvite(true);
    setInviteMsg("");
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: inviteAuthPwd,
      });
      if (authErr) {
        setInviteMsg("Contraseña incorrecta. No se envió la invitación.");
        setSendingInvite(false);
        return;
      }
      const res = await fetch(`${BACKEND_URL}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          email: inviteEmail,
          role: "custom",
          permissions,
          branch_ids: selectedBranchIds,
          invited_by: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar invitación");
      setInviteMsg(`✓ Invitación enviada a ${inviteEmail}`);
      setInviteEmail("");
      setInviteAuthPwd("");
      setSelectedBranchIds([]);
      setPermissions({
        agenda: false, clientes: false, campanas: false,
        servicios: false, staff: false, sucursales: false, negocio: false,
      });
      setShowInviteForm(false);
      loadTeam(tenantId);
    } catch (e: any) {
      setInviteMsg("Error: " + e.message);
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

  const handleRevoke = (memberId: string, memberEmail: string) => {
    setRevokeTarget({ id: memberId, email: memberEmail });
    setRevokePwd("");
    setRevokeMsg("");
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget || !revokePwd) return;
    setRevoking(true);
    setRevokeMsg("");
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: revokePwd,
      });
      if (authErr) {
        setRevokeMsg("Contraseña incorrecta.");
        setRevoking(false);
        return;
      }
      await fetch(`${BACKEND_URL}/members/${revokeTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, is_active: false }),
      });
      setRevokeTarget(null);
      loadTeam(tenantId);
    } catch (e: any) {
      setRevokeMsg("Error: " + e.message);
    } finally {
      setRevoking(false);
    }
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
              Correo actual:{" "}
              <span style={{ color: "var(--text-main)" }}>{currentUser?.email ?? "…"}</span>.
              {" "}El cambio requiere confirmación desde tu correo actual y desde el nuevo correo.
            </p>

            {!emailChangeLoaded ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Cargando...</p>
            ) : emailChangeStatus?.pending ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-blue-500/20 px-4 py-3 text-sm" style={{ background: "rgba(37,99,235,0.06)" }}>
                  <p className="font-medium mb-2" style={{ color: "#93c5fd" }}>
                    Cambio en proceso → <strong style={{ color: "#f1f5f9" }}>{emailChangeStatus.new_email}</strong>
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={emailChangeStatus.old_confirmed ? "text-green-400" : "text-yellow-400"}>
                        {emailChangeStatus.old_confirmed ? "✓" : "○"}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {emailChangeStatus.old_confirmed
                          ? "Correo actual confirmado"
                          : "Pendiente: confirmar desde tu correo actual"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={emailChangeStatus.new_confirmed ? "text-green-400" : "text-yellow-400"}>
                        {emailChangeStatus.new_confirmed ? "✓" : "○"}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {emailChangeStatus.new_confirmed
                          ? "Nuevo correo verificado"
                          : "Pendiente: verificar nuevo correo"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setEmailChangeStatus({ pending: false }); setEmailChangeLoaded(true); }}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: "rgba(37,99,235,0.2)", color: "var(--text-muted)" }}
                >
                  Cancelar y solicitar nuevo cambio
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className={label} style={{ color: "var(--text-muted)" }}>Nuevo correo electrónico</label>
                  <input
                    value={newEmailInput}
                    onChange={e => setNewEmailInput(e.target.value)}
                    type="email"
                    placeholder="nuevo@correo.com"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={label} style={{ color: "var(--text-muted)" }}>Tu contraseña actual</label>
                  <input
                    value={emailChangePwd}
                    onChange={e => setEmailChangePwd(e.target.value)}
                    type="password"
                    placeholder="Confirma tu identidad"
                    className={inp}
                  />
                </div>
                <button
                  onClick={handleRequestEmailChange}
                  disabled={!newEmailInput.trim() || !emailChangePwd || requestingEmailChange}
                  className={btn}
                >
                  {requestingEmailChange ? "Enviando..." : "Solicitar cambio de correo"}
                </button>
                {emailRequestMsg && (
                  <p className={`text-xs ${emailRequestIsError ? "text-red-400" : "text-green-400"}`}>
                    {emailRequestMsg}
                  </p>
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
                    onClick={() => {
                      if (m.role === "owner") return;
                      setEditingUser(m);
                      setEditPermissions(m.permissions ?? {});
                      setEditBranchIds(m.branch_ids ?? []);
                    }}
                    className={`flex items-center justify-between py-2.5 border-b last:border-0 ${m.role !== "owner" ? "cursor-pointer hover:bg-blue-950/20 rounded-lg px-2 -mx-2 transition-colors" : ""}`}
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
                          onClick={() => handleRevoke(m.id, m.email ?? "")}
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
          {!showInviteForm ? (
            <button
              onClick={() => setShowInviteForm(true)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <i className="ti ti-user-plus" style={{ fontSize: 15 }} aria-hidden="true" />
              Crear nuevo usuario
            </button>
          ) : (
          <div className="rounded-2xl border border-blue-900/25 p-5" style={{ background: "var(--bg-card)" }}>
            <h3 className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-main)" }}>
              Crea acceso para tu equipo
            </h3>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              La persona recibirá un correo para crear su contraseña y acceder al dashboard con los permisos que definas.
            </p>

            {/* Email */}
            <div className="mb-5">
              <label className={label} style={{ color: "var(--text-muted)" }}>Correo electrónico</label>
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                type="email"
                placeholder="correo@ejemplo.com"
                className={inp}
              />
            </div>

            {/* Permisos por módulo */}
            <div className="mb-5">
              <label className={label} style={{ color: "var(--text-muted)" }}>Acceso por módulo</label>
              <div className="space-y-2 mt-1.5">
                {[
                  { key: "agenda", label: "Agenda" },
                  { key: "clientes", label: "Clientes" },
                  { key: "campanas", label: "Campañas" },
                  { key: "servicios", label: "Servicios" },
                  { key: "staff", label: "Staff" },
                  { key: "sucursales", label: "Sucursales" },
                  { key: "negocio", label: "Negocio" },
                ].map(({ key, label: modLabel }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-blue-900/20"
                    style={{ background: "rgba(10,15,30,0.5)" }}
                  >
                    <span className="text-sm" style={{ color: "var(--text-main)" }}>{modLabel}</span>
                    <div className="flex items-center gap-3">
                      {permissions[key] !== false && (
                        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "rgba(37,99,235,0.15)" }}>
                          <button
                            onClick={() => setPermissions(prev => ({ ...prev, [key]: "view" }))}
                            className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                              permissions[key] === "view"
                                ? "bg-blue-600 text-white"
                                : "text-blue-300/50 hover:text-blue-300"
                            }`}
                          >
                            Solo ver
                          </button>
                          <button
                            onClick={() => setPermissions(prev => ({ ...prev, [key]: "edit" }))}
                            className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                              permissions[key] === "edit"
                                ? "bg-blue-600 text-white"
                                : "text-blue-300/50 hover:text-blue-300"
                            }`}
                          >
                            Ver y editar
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => toggleModule(key)}
                        className="relative flex-shrink-0 rounded-full transition-colors"
                        style={{
                          width: 40, height: 22,
                          background: permissions[key] !== false ? "#2563eb" : "rgba(37,99,235,0.2)",
                        }}
                      >
                        <span
                          className="absolute top-0.5 bg-white rounded-full transition-transform"
                          style={{
                            left: 2, width: 18, height: 18,
                            transform: permissions[key] !== false ? "translateX(18px)" : "translateX(0)",
                          }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                Billing y Configuración solo son accesibles para el propietario.
              </p>
            </div>

            {/* Acceso por sucursal */}
            {branches.length > 0 && (
              <div className="mb-5">
                <label className={label} style={{ color: "var(--text-muted)" }}>Acceso por sucursal</label>
                <div className="space-y-2 mt-1.5">
                  {branches.map(branch => (
                    <label
                      key={branch.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-blue-900/20 cursor-pointer hover:border-blue-700/30 transition-colors"
                      style={{ background: "rgba(10,15,30,0.5)" }}
                    >
                      <div className="flex items-center gap-2">
                        <i className="ti ti-building-store text-blue-400/60" style={{ fontSize: 15 }} aria-hidden="true" />
                        <span className="text-sm" style={{ color: "var(--text-main)" }}>{branch.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedBranchIds.includes(branch.id)}
                        onChange={() => toggleBranch(branch.id)}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                  Si no seleccionas ninguna, el usuario verá información de todas las sucursales activas.
                </p>
              </div>
            )}

            {/* Confirmación con contraseña */}
            <div className="mb-5 p-4 rounded-xl border border-blue-900/30" style={{ background: "rgba(37,99,235,0.06)" }}>
              <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-main)" }}>Confirma con tu contraseña</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                Por seguridad, ingresa tu contraseña actual para enviar esta invitación.
              </p>
              <input
                value={inviteAuthPwd}
                onChange={e => setInviteAuthPwd(e.target.value)}
                type="password"
                placeholder="Tu contraseña actual"
                className={inp}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleInvite}
                disabled={sendingInvite || !inviteEmail.trim() || !inviteAuthPwd}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <i className="ti ti-send" style={{ fontSize: 14 }} aria-hidden="true" />
                {sendingInvite ? "Enviando..." : "Enviar invitación"}
              </button>
              <button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail("");
                  setInviteAuthPwd("");
                  setSelectedBranchIds([]);
                  setPermissions({ agenda: false, clientes: false, campanas: false, servicios: false, staff: false, sucursales: false, negocio: false });
                  setInviteMsg("");
                }}
                className="px-4 py-2.5 rounded-xl border border-blue-900/30 text-sm transition-all active:scale-95 hover:border-blue-700/40"
                style={{ color: "var(--text-muted)" }}
              >
                Cancelar
              </button>
            </div>
            {inviteMsg && (
              <p className={`text-xs mt-3 text-center ${inviteMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                {inviteMsg}
              </p>
            )}
          </div>
          )}
        </div>
      )}

      {/* ── MODAL: Editar permisos de usuario ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="absolute inset-0" onClick={() => setEditingUser(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-blue-900/40 p-6 shadow-2xl shadow-blue-950/50 max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-card)" }}>
            <h3 className="text-base font-semibold mb-0.5" style={{ color: "var(--text-main)" }}>Editar permisos</h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{editingUser.name ?? editingUser.email}</p>

            {/* Permisos por módulo */}
            <div className="space-y-2 mb-5">
              {[
                { key: "agenda", label: "Agenda" },
                { key: "clientes", label: "Clientes" },
                { key: "campanas", label: "Campañas" },
                { key: "servicios", label: "Servicios" },
                { key: "staff", label: "Staff" },
                { key: "sucursales", label: "Sucursales" },
                { key: "negocio", label: "Negocio" },
              ].map(({ key, label: modLabel }) => (
                <div key={key} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-blue-900/20" style={{ background: "rgba(10,15,30,0.5)" }}>
                  <span className="text-sm" style={{ color: "var(--text-main)" }}>{modLabel}</span>
                  <div className="flex items-center gap-3">
                    {editPermissions[key] !== false && (
                      <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "rgba(37,99,235,0.15)" }}>
                        <button
                          onClick={() => setEditPermissions(prev => ({ ...prev, [key]: "view" }))}
                          className={`text-xs px-2.5 py-1 rounded-md transition-all ${editPermissions[key] === "view" ? "bg-blue-600 text-white" : "text-blue-300/50 hover:text-blue-300"}`}
                        >
                          Solo ver
                        </button>
                        <button
                          onClick={() => setEditPermissions(prev => ({ ...prev, [key]: "edit" }))}
                          className={`text-xs px-2.5 py-1 rounded-md transition-all ${editPermissions[key] === "edit" ? "bg-blue-600 text-white" : "text-blue-300/50 hover:text-blue-300"}`}
                        >
                          Ver y editar
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setEditPermissions(prev => ({ ...prev, [key]: prev[key] === false ? "view" : false }))}
                      className="relative flex-shrink-0 rounded-full transition-colors"
                      style={{ width: 40, height: 22, background: editPermissions[key] !== false ? "#2563eb" : "rgba(37,99,235,0.2)" }}
                    >
                      <span
                        className="absolute top-0.5 bg-white rounded-full transition-transform"
                        style={{ left: 2, width: 18, height: 18, transform: editPermissions[key] !== false ? "translateX(18px)" : "translateX(0)" }}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Acceso por sucursal */}
            {branches.length > 0 && (
              <>
                <label className="text-xs mb-2 block font-medium" style={{ color: "var(--text-muted)" }}>Acceso por sucursal</label>
                <div className="space-y-2 mb-6">
                  {branches.map(branch => (
                    <label key={branch.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-blue-900/20 cursor-pointer hover:border-blue-700/30 transition-colors" style={{ background: "rgba(10,15,30,0.5)" }}>
                      <div className="flex items-center gap-2">
                        <i className="ti ti-building-store text-blue-400/60" style={{ fontSize: 15 }} aria-hidden="true" />
                        <span className="text-sm" style={{ color: "var(--text-main)" }}>{branch.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={editBranchIds.includes(branch.id)}
                        onChange={() => setEditBranchIds(prev => prev.includes(branch.id) ? prev.filter(id => id !== branch.id) : [...prev, branch.id])}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-blue-900/40 text-sm font-medium transition-all active:scale-95 hover:border-blue-700/60"
                style={{ color: "var(--text-muted)" }}
              >
                Cancelar
              </button>
              <button
                disabled={savingUserEdit}
                onClick={async () => {
                  setSavingUserEdit(true);
                  try {
                    await fetch(`${BACKEND_URL}/members/${editingUser.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ tenant_id: tenantId, permissions: editPermissions, branch_ids: editBranchIds }),
                    });
                    loadTeam(tenantId);
                    setEditingUser(null);
                  } catch (e) {
                    console.error("Error guardando permisos:", e);
                  } finally {
                    setSavingUserEdit(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                {savingUserEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmar revocación con contraseña ── */}
      {revokeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) { setRevokeTarget(null); setRevokePwd(""); setRevokeMsg(""); } }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-6"
            style={{ background: "var(--bg-card)", borderColor: "rgba(239,68,68,0.3)" }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-main)" }}>
              Revocar acceso
            </h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Vas a revocar el acceso de <strong style={{ color: "var(--text-main)" }}>{revokeTarget.email}</strong>.
              Ingresa tu contraseña para confirmar.
            </p>
            <input
              value={revokePwd}
              onChange={e => setRevokePwd(e.target.value)}
              type="password"
              placeholder="Tu contraseña actual"
              className={inp}
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") handleConfirmRevoke(); }}
            />
            {revokeMsg && <p className="text-xs text-red-400 mt-2">{revokeMsg}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setRevokeTarget(null); setRevokePwd(""); setRevokeMsg(""); }}
                className="flex-1 py-2 rounded-xl text-sm border transition-colors"
                style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRevoke}
                disabled={!revokePwd || revoking}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all disabled:opacity-40"
              >
                {revoking ? "Revocando..." : "Sí, revocar acceso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
