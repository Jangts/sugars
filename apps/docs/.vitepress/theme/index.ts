import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import LanguageSwitch from './LanguageSwitch.vue'
import './style.css'

export default {
    extends: DefaultTheme,
    Layout: () => h(DefaultTheme.Layout, null, {
        'nav-bar-content-after': () => h(LanguageSwitch),
        'nav-screen-content-after': () => h(LanguageSwitch),
    }),
}
