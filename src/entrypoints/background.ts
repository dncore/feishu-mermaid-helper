import { defineBackground } from 'wxt/utils/define-background'

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Feishu Mermaid Visual Editor installed')
  })
})
