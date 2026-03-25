<template>
  <div class="home">
    <!-- Top bar -->
    <AppHeader>
      <template #title>
        <p class="home__greeting-text">{{ greeting }},</p>
        <h2 class="home__greeting-name">User</h2>
      </template>
      <template #action>
        <button class="home__notif" aria-label="Notifications">
          <LucideBell :size="22" />
          <span class="home__notif-dot" />
        </button>
      </template>
    </AppHeader>

    <!-- CTA hero card -->
    <div class="home__hero" @click="navigateTo('/Chat')">
      <div class="home__hero-content">
        <h3 class="home__hero-title">Chat with Pact AI</h3>
        <p class="home__hero-desc">
          Describe your agreement and AI will draft a contract for you
        </p>
        <span class="home__hero-cta">
          Get started
          <LucideArrowRight :size="16" />
        </span>
      </div>
      <div class="home__hero-icon">
        <LucideFileSignature :size="48" />
      </div>
    </div>

    <!-- Stats -->
    <div class="home__stats">
      <div class="home__stat">
        <span class="home__stat-value">0</span>
        <span class="home__stat-label">Contracts</span>
      </div>
      <div class="home__stat-divider" />
      <div class="home__stat">
        <span class="home__stat-value">0</span>
        <span class="home__stat-label">Pending</span>
      </div>
      <div class="home__stat-divider" />
      <div class="home__stat">
        <span class="home__stat-value">0</span>
        <span class="home__stat-label">Escrow</span>
      </div>
    </div>

    <!-- Quick actions -->
    <section class="home__section">
      <h3 class="home__section-title">Quick actions</h3>
      <div class="home__actions">
        <button class="home__action" @click="navigateTo('/Chat')">
          <span class="home__action-icon">
            <LucideSparkles :size="20" />
          </span>
          <span class="home__action-label">New contract</span>
        </button>
        <button class="home__action" @click="navigateTo('/Contracts')">
          <span class="home__action-icon">
            <LucideFolderOpen :size="20" />
          </span>
          <span class="home__action-label">My contracts</span>
        </button>
        <button class="home__action" @click="navigateTo('/History')">
          <span class="home__action-icon">
            <LucideMessagesSquare :size="20" />
          </span>
          <span class="home__action-label">Chat history</span>
        </button>
      </div>
    </section>

    <!-- Recent contracts -->
    <section class="home__section">
      <div class="home__section-header">
        <h3 class="home__section-title">Recent contracts</h3>
        <NuxtLink to="/Contracts" class="home__section-link">
          View all
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div class="home__empty">
        <div class="home__empty-icon">
          <LucideFileText :size="32" />
        </div>
        <p class="home__empty-title">No contracts yet</p>
        <p class="home__empty-desc">
          Your generated contracts will appear here
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Dashboard",
  description:
    "Your Pact AI dashboard — create contracts, track signatures, and manage escrow payments.",
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
});
</script>

<style scoped>
.home {
  padding: 20px 20px 0;
  max-width: 560px;
  margin: 0 auto;
}

.home__greeting-text {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0;
  line-height: 1.2;
}

.home__greeting-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 2px 0 0;
  line-height: 1.2;
}

.home__notif {
  position: relative;
}

.home__notif-dot {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  border: 2px solid var(--color-white);
}

/* Hero card */
.home__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: 20px;
  background: var(--color-primary);
  color: var(--color-off-white);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  margin: 20px 0;
}

.home__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(45, 1, 2, 0.25);
}

.home__hero:active {
  transform: scale(0.98);
}

.home__hero-content {
  flex: 1;
}

.home__hero-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 6px;
  line-height: 1.2;
}

.home__hero-desc {
  font-size: 13px;
  font-weight: 300;
  opacity: 0.7;
  margin: 0 0 14px;
  line-height: 1.4;
}

.home__hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  font-style: italic;
}

.home__hero-icon {
  opacity: 0.2;
  flex-shrink: 0;
}

/* Stats */
.home__stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 18px 12px;
  border-radius: 16px;
  background: rgba(45, 1, 2, 0.03);
  margin-bottom: 28px;
}

.home__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.home__stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.home__stat-label {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-gray-dark);
}

.home__stat-divider {
  width: 1px;
  height: 32px;
  background: var(--color-gray-light);
}

/* Sections */
.home__section {
  margin-bottom: 28px;
}

.home__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.home__section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-black);
  margin: 0 0 14px;
}

.home__section-header .home__section-title {
  margin: 0;
}

.home__section-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-accent);
  text-decoration: none;
}

/* Quick actions */
.home__actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.home__action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: 16px;
  border: 1.5px solid rgba(45, 1, 2, 0.08);
  background: var(--color-white);
  cursor: pointer;
  transition: all 0.2s ease;
}

.home__action:hover {
  border-color: var(--color-primary);
  background: rgba(45, 1, 2, 0.02);
}

.home__action:active {
  transform: scale(0.96);
}

.home__action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(45, 1, 2, 0.05);
  color: var(--color-primary);
}

.home__action-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
  white-space: nowrap;
}

/* Empty state */
.home__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
  border-radius: 16px;
  border: 1.5px dashed var(--color-gray-light);
}

.home__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.04);
  color: var(--color-gray-medium);
  margin-bottom: 12px;
}

.home__empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-black);
  margin: 0 0 4px;
}

.home__empty-desc {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0;
}

@media (min-width: 768px) {
  .home {
    padding: 28px 24px 0;
  }

  .home__greeting-name {
    font-size: 26px;
  }

  .home__hero {
    padding: 32px;
  }

  .home__hero-title {
    font-size: 20px;
  }
}
</style>
