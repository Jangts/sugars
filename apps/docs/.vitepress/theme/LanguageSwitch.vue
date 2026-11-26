<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { languageKey, languageOf, languageRoute } from '../../scripts/routing.mjs'

const { page } = useData()
const other = computed(() => languageOf(page.value.relativePath) === 'zh' ? 'en' : 'zh')
const href = computed(() => withBase(languageRoute(page.value.relativePath, other.value)))

function remember(event: MouseEvent) {
    try { localStorage.setItem(languageKey, other.value) } catch {}
    const link = event.currentTarget as HTMLAnchorElement
    link.href = href.value + location.search + location.hash
}
</script>

<template>
    <a class="sugars-language" :href="href" :hreflang="other === 'zh' ? 'zh-CN' : 'en'" target="_self" @click="remember">
        {{ other === 'zh' ? '简体中文' : 'English' }}
    </a>
</template>
