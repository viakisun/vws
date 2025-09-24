#!/usr/bin/env node
// Fix malformed HTML tags in attendance page

const fs = require('fs')

const filePath = 'src/routes/hr/attendance/+page.svelte'
const src = fs.readFileSync(filePath, 'utf8')

let updated = src

// Fix malformed tags with empty id attributes
updated = updated.replace(/id="field-">/g, 'id="field-employee">')
updated = updated.replace(/id="field-">/g, 'id="field-leavetype">')
updated = updated.replace(/id="field-">/g, 'id="field-date">')
updated = updated.replace(/id="field-">/g, 'id="field-checkin">')
updated = updated.replace(/id="field-">/g, 'id="field-checkout">')
updated = updated.replace(/id="field-">/g, 'id="field-status">')
updated = updated.replace(/id="field-">/g, 'id="field-notes">')

// Fix malformed self-closing tags
updated = updated.replace(/\/ id="field-([^"]*)">/g, 'id="field-$1">')
updated = updated.replace(/\/ id="field-([^"]*)">/g, 'id="field-$1">')

// Fix specific patterns
updated = updated.replace(
  /<input\s+type="date"\s+bind:value=\{leaveRequestForm\.startDate\}\s+required\s+class="[^"]*"\s+id="field-employee">/g,
  '<input type="date" bind:value={leaveRequestForm.startDate} required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="field-startdate">'
)

updated = updated.replace(
  /<input\s+type="date"\s+bind:value=\{leaveRequestForm\.endDate\}\s+required\s+class="[^"]*"\s+id="field-leavetype">/g,
  '<input type="date" bind:value={leaveRequestForm.endDate} required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="field-enddate">'
)

// Fix textarea
updated = updated.replace(
  /<textarea\s+bind:value=\{leaveRequestForm\.reason\}\s+rows="3"\s+class="[^"]*"\s+placeholder="[^"]*"\s+id="field-notes"><\/textarea>/g,
  '<textarea bind:value={leaveRequestForm.reason} rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="휴가 신청 사유를 입력하세요" id="field-reason"></textarea>'
)

fs.writeFileSync(filePath, updated, 'utf8')
console.log('Fixed malformed HTML tags in attendance page')

