<template>
  <div class="profile">
    <header class="profile__header">
      <h1 class="profile__title">Profile</h1>
      <button class="profile__settings" aria-label="Settings">
        <LucideSettings :size="20" />
      </button>
    </header>

    <!-- Avatar + info -->
    <div class="profile__card">
      <div class="profile__avatar">
        <LucideUser :size="32" />
      </div>
      <div class="profile__info">
        <p class="profile__name">User</p>
        <p class="profile__email">user@email.com</p>
      </div>
    </div>

    <!-- Stats row -->
    <div class="profile__stats">
      <div class="profile__stat">
        <span class="profile__stat-value">0</span>
        <span class="profile__stat-label">Created</span>
      </div>
      <div class="profile__stat">
        <span class="profile__stat-value">0</span>
        <span class="profile__stat-label">Signed</span>
      </div>
      <div class="profile__stat">
        <span class="profile__stat-value">0</span>
        <span class="profile__stat-label">Escrow</span>
      </div>
    </div>

    <!-- Menu items -->
    <nav class="profile__menu">
      <button class="profile__menu-item">
        <span class="profile__menu-icon"><LucideUser :size="18" /></span>
        <span class="profile__menu-label">Edit profile</span>
        <LucideChevronRight :size="18" class="profile__menu-arrow" />
      </button>
      <button class="profile__menu-item">
        <span class="profile__menu-icon"><LucideBell :size="18" /></span>
        <span class="profile__menu-label">Notifications</span>
        <LucideChevronRight :size="18" class="profile__menu-arrow" />
      </button>
      <button class="profile__menu-item">
        <span class="profile__menu-icon"><LucideShieldCheck :size="18" /></span>
        <span class="profile__menu-label">Security</span>
        <LucideChevronRight :size="18" class="profile__menu-arrow" />
      </button>
      <button class="profile__menu-item">
        <span class="profile__menu-icon"><LucideHelpCircle :size="18" /></span>
        <span class="profile__menu-label">Help & Support</span>
        <LucideChevronRight :size="18" class="profile__menu-arrow" />
      </button>
    </nav>

    <!-- Sign out -->
    <button class="profile__signout">
      <LucideLogOut :size="18" />
      Sign out
    </button>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });
</script>

<style scoped>
.profile {
  padding: 20px 20px 0;
  max-width: 560px;
  margin: 0 auto;
}

.profile__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.profile__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.profile__settings {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(45, 1, 2, 0.04);
  border: none;
  color: var(--color-primary);
  cursor: pointer;
}

/* Avatar card */
.profile__card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.profile__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.06);
  color: var(--color-primary);
  flex-shrink: 0;
}

.profile__name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-black);
  margin: 0 0 2px;
}

.profile__email {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0;
}

/* Stats */
.profile__stats {
  display: flex;
  justify-content: space-around;
  padding: 18px 12px;
  border-radius: 16px;
  background: rgba(45, 1, 2, 0.03);
  margin-bottom: 28px;
}

.profile__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.profile__stat-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.profile__stat-label {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-gray-dark);
}

/* Menu */
.profile__menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 32px;
}

.profile__menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 4px;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(45, 1, 2, 0.05);
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 0;
}

.profile__menu-item:hover {
  background: rgba(45, 1, 2, 0.02);
}

.profile__menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(45, 1, 2, 0.04);
  color: var(--color-primary);
  flex-shrink: 0;
}

.profile__menu-label {
  flex: 1;
  text-align: left;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-black);
}

.profile__menu-arrow {
  color: var(--color-gray-medium);
}

/* Sign out */
.profile__signout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: 1.5px solid rgba(170, 1, 1, 0.15);
  background: rgba(170, 1, 1, 0.04);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-accent);
  cursor: pointer;
  transition: all 0.2s;
}

.profile__signout:hover {
  background: rgba(170, 1, 1, 0.08);
}
</style>
