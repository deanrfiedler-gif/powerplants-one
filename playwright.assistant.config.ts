import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testDir:'tests/assistant',testMatch:'*.spec.ts',timeout:120000,projects:[
  {name:'desktop-chromium',use:{browserName:'chromium',channel:'chromium',viewport:{width:1440,height:1000}}},
  {name:'mobile-chromium',use:{browserName:'chromium',channel:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
],reporter:[['list'],['json',{outputFile:'verification-evidence/ai1/browser-results.json'}]]});
