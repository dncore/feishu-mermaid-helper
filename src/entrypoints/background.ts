import { defineBackground } from 'wxt/sandbox'

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Feishu Mermaid Visual Editor installed')
  })
})
