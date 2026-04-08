<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowDown } from '@element-plus/icons-vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmStatusTag from '@/components/admin/common/AdmStatusTag.vue'
import AdmActionGroup from '@/components/admin/common/AdmActionGroup.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
import AdmDetailDrawer from '@/components/admin/common/AdmDetailDrawer.vue'
import {
  adminConfirm,
  mockDelay,
  toastInfo,
  toastSuccess,
  useAdminListUi,
} from '@/composables/admin/useAdminListUi'

type Row = { id: string; name: string; status: 'PENDING' | 'ACTIVE' }

const route = useRoute()
const { t } = useI18n()
const { loading, withLoading } = useAdminListUi()

const pageTitle = computed(() => {
  const k = route.meta.titleKey as string | undefined
  if (k) return t(k) as string
  const title = route.meta.title as string | undefined
  return title ?? ''
})

const keyword = ref('')
const status = ref<'' | 'PENDING' | 'ACTIVE'>('')
const page = ref(1)
const pageSize = ref(10)

const allRows = ref<Row[]>([
  { id: '1', name: t('admin.placeholder.demoRowA'), status: 'PENDING' },
  { id: '2', name: t('admin.placeholder.demoRowB'), status: 'ACTIVE' },
  { id: '3', name: '示例记录 C', status: 'PENDING' },
  { id: '4', name: '示例记录 D', status: 'ACTIVE' },
  { id: '5', name: '示例记录 E', status: 'PENDING' },
])

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((r) => r.id.includes(kw) || r.name.toLowerCase().includes(kw))
  }
  if (status.value) {
    list = list.filter((r) => r.status === status.value)
  }
  return list
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const total = computed(() => filteredRows.value.length)

const drawerOpen = ref(false)
const reviewOpen = ref(false)
const editOpen = ref(false)
const currentRow = ref<Row | null>(null)
const reviewRemark = ref('')
const editName = ref('')

async function handleQuery() {
  await withLoading(async () => {
    await mockDelay()
    page.value = 1
    toastSuccess(t('admin.placeholder.queryOk'))
  })
}

function handleReset() {
  keyword.value = ''
  status.value = ''
  page.value = 1
  toastInfo(t('admin.placeholder.resetOk'))
}

async function handleRefresh() {
  await withLoading(async () => {
    await mockDelay()
    toastSuccess(t('admin.placeholder.refreshOk'))
  })
}

function handleExport() {
  toastInfo(t('admin.placeholder.exportTip'))
}

function openDetail(row: Row) {
  currentRow.value = row
  drawerOpen.value = true
}

function openReview(row: Row) {
  currentRow.value = row
  reviewRemark.value = ''
  reviewOpen.value = true
}

function submitReview() {
  reviewOpen.value = false
  toastSuccess(`${t('admin.placeholder.reviewTitle')}：${currentRow.value?.id ?? '—'}`)
}

function openEdit(row: Row) {
  currentRow.value = row
  editName.value = row.name
  editOpen.value = true
}

function saveEdit() {
  if (!currentRow.value) return
  const id = currentRow.value.id
  const ix = allRows.value.findIndex((r) => r.id === id)
  if (ix !== -1) {
    allRows.value[ix] = { ...allRows.value[ix], name: editName.value }
  }
  editOpen.value = false
  toastSuccess(t('admin.placeholder.saveOk'))
}

async function handleDelete(row: Row) {
  const ok = await adminConfirm(t('admin.placeholder.deleteConfirm'))
  if (!ok) return
  allRows.value = allRows.value.filter((r) => r.id !== row.id)
  if (currentRow.value?.id === row.id) {
    drawerOpen.value = false
    currentRow.value = null
  }
  toastSuccess(t('admin.placeholder.saveOk'))
}

async function copyId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    toastSuccess(t('admin.placeholder.copyOk'))
  } catch {
    toastInfo(id)
  }
}

function confirmDrawer() {
  drawerOpen.value = false
  toastSuccess(t('admin.placeholder.saveOk'))
}
</script>

<template>
  <div class="adm-mod" v-loading="loading">
    <header class="adm-mod__head">
      <h1 class="adm-mod__title">{{ pageTitle }}</h1>
      <p class="adm-mod__desc">
        {{ t('admin.placeholder.desc') }}
      </p>
    </header>

    <AdmFilterBar>
      <el-form-item :label="t('admin.placeholder.keyword')">
        <el-input
          v-model="keyword"
          :placeholder="t('admin.placeholder.keywordPh')"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item :label="t('admin.placeholder.status')">
        <el-select v-model="status" :placeholder="t('admin.placeholder.statusAll')" clearable style="width: 140px">
          <el-option :label="t('admin.placeholder.statusAll')" value="" />
          <el-option :label="t('admin.placeholder.statusPending')" value="PENDING" />
          <el-option :label="t('admin.placeholder.statusActive')" value="ACTIVE" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">{{ t('admin.placeholder.query') }}</el-button>
        <el-button @click="handleReset">{{ t('admin.placeholder.reset') }}</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar :title="t('admin.placeholder.tableTitle')">
      <template #right>
        <el-button type="primary" plain @click="handleExport">{{ t('admin.placeholder.exportCsv') }}</el-button>
        <el-button @click="handleRefresh">{{ t('admin.placeholder.refresh') }}</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-mod__table">
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="name" :label="t('admin.placeholder.colName')" min-width="160" />
      <el-table-column :label="t('admin.placeholder.colStatus')" width="120" align="center">
        <template #default="{ row }">
          <AdmStatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.placeholder.actions')" width="260" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openDetail(row)">{{ t('admin.placeholder.detail') }}</el-button>
            <el-button type="warning" link @click="openReview(row)">{{ t('admin.placeholder.review') }}</el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => (cmd === 'edit' ? openEdit(row) : cmd === 'del' ? handleDelete(row) : copyId(row.id))">
              <el-button type="primary" link class="adm-mod__more">
                {{ t('admin.placeholder.more') }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">{{ t('admin.placeholder.edit') }}</el-dropdown-item>
                  <el-dropdown-item command="copy">{{ t('admin.placeholder.copyId') }}</el-dropdown-item>
                  <el-dropdown-item command="del" divided>{{ t('admin.placeholder.delete') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </AdmActionGroup>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer
      v-model="drawerOpen"
      :title="`${t('admin.placeholder.drawerTitle')} · ${currentRow?.id ?? ''}`"
    >
      <template v-if="currentRow">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="ID">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item :label="t('admin.placeholder.colName')">{{ currentRow.name }}</el-descriptions-item>
          <el-descriptions-item :label="t('admin.placeholder.colStatus')">
            <AdmStatusTag :status="currentRow.status" />
          </el-descriptions-item>
        </el-descriptions>
        <p class="adm-mod__drawer-txt">{{ t('admin.placeholder.drawerBody') }}</p>
      </template>
      <template #footer>
        <el-button @click="drawerOpen = false">{{ t('admin.placeholder.close') }}</el-button>
        <el-button type="primary" @click="confirmDrawer">{{ t('admin.placeholder.confirm') }}</el-button>
      </template>
    </AdmDetailDrawer>

    <el-dialog v-model="reviewOpen" :title="t('admin.placeholder.reviewTitle')" width="480px" destroy-on-close>
      <el-input v-model="reviewRemark" type="textarea" :rows="4" :placeholder="t('admin.placeholder.reviewRemark')" />
      <template #footer>
        <el-button @click="reviewOpen = false">{{ t('admin.placeholder.close') }}</el-button>
        <el-button type="primary" @click="submitReview">{{ t('admin.placeholder.submitReview') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editOpen" :title="t('admin.placeholder.editTitle')" width="440px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item :label="t('admin.placeholder.colName')">
          <el-input v-model="editName" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">{{ t('admin.placeholder.close') }}</el-button>
        <el-button type="primary" @click="saveEdit">{{ t('admin.placeholder.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.adm-mod__head {
  margin-bottom: 14px;
}

.adm-mod__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-mod__desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.adm-mod__table {
  border-radius: 8px;
}

.adm-mod__drawer-txt {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.adm-mod__more {
  margin-left: 2px;
}
</style>
