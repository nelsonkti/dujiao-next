<template>
  <div class="vault-products relative min-h-[calc(100vh-70px)] overflow-hidden bg-[#101218] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_10%,rgba(91,108,168,0.26),transparent_38%),radial-gradient(circle_at_8%_80%,rgba(26,116,116,0.18),transparent_32%),linear-gradient(135deg,#11141d_0%,#1a1b22_52%,#101217_100%)]"></div>
    <div class="relative mx-auto grid w-full max-w-[1540px] items-start gap-5 px-3 py-5 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-7 lg:px-8 lg:py-10">
      <!-- 筛选侧栏：桌面竖排 + 移动端横向 chips -->
      <div class="grid min-w-0 gap-3 lg:sticky lg:top-[88px] lg:gap-5">
        <!-- 分类：使用 VaultCategorySidebar，移动端自动变横向 chips -->
        <VaultCategorySidebar
          :category-groups="categoryGroups"
          :selected-category="selectedCategory"
          :expanded-parent-ids="expandedParentIds"
          variant="glass"
          @select="selectCategory"
          @toggle="toggleParentCategory"
        />
      </div>

      <!-- 商品区 -->
      <section class="min-w-0">
        <div class="relative mb-6">
          <Search class="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
          <input
            v-model="searchQuery"
            class="h-16 w-full rounded-2xl border border-white/15 bg-white/[0.08] pl-14 pr-12 text-base text-white shadow-2xl outline-none backdrop-blur-xl transition placeholder:text-white/45 hover:border-white/25 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20"
            :placeholder="t('products.searchBoxPlaceholder')"
            :aria-label="t('products.searchLabel')"
          />
          <button v-if="searchQuery" type="button" class="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white" :aria-label="t('blog.searchClear')" @click="clearSearch"><X class="h-4 w-4" /></button>
        </div>

        <div v-if="loading" class="space-y-4">
          <div v-for="i in 6" :key="i" class="h-[122px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.07]"></div>
        </div>

        <template v-else-if="productGroups.length">
          <div class="space-y-8">
            <div v-for="group in productGroups" :key="group.categoryId ?? 'uncategorized'">
              <div class="mb-3 flex items-center gap-3 px-1">
                <span class="h-7 w-1 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.65)]"></span>
                <img v-if="group.categoryIcon" :src="getImageUrl(group.categoryIcon)" :alt="group.categoryName" loading="lazy" class="h-7 w-7 rounded-lg object-cover" />
                <span class="min-w-0 truncate text-lg font-bold tracking-tight text-white">{{ group.categoryName }}</span>
                <span class="text-sm font-semibold text-white/40">({{ group.products.length }})</span>
              </div>
              <div class="space-y-3">
                <VaultProductListItem
                  v-for="(product, idx) in group.products"
                  :key="product.id"
                  :product="product"
                  :index="idx"
                  variant="glass"
                  @quick-buy="openQuickBuy"
                />
              </div>
            </div>
          </div>

          <nav v-if="totalPages > 1" class="mt-8 flex justify-center gap-2">
            <button class="grid h-10 min-w-10 place-items-center rounded-full border border-white/15 bg-white/[0.08] px-3 font-bold text-white/60 backdrop-blur hover:border-sky-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)"><ChevronLeft class="h-[17px] w-[17px]" /></button>
            <button
              v-for="p in pageWindow"
              :key="p"
              class="grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm font-bold"
              :class="p === currentPage ? 'border-sky-400 bg-sky-400 text-slate-950' : 'border-white/15 bg-white/[0.08] text-white/60 backdrop-blur hover:border-sky-400/60 hover:text-white'"
              @click="changePage(p)"
            >{{ p }}</button>
            <button class="grid h-10 min-w-10 place-items-center rounded-full border border-white/15 bg-white/[0.08] px-3 font-bold text-white/60 backdrop-blur hover:border-sky-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)"><ChevronRight class="h-[17px] w-[17px]" /></button>
          </nav>
        </template>

        <div v-else class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.05] py-14 text-center text-white/55">
          <component :is="searchQuery || selectedCategory ? SearchX : PackageOpen" class="h-12 w-12 opacity-60" />
          <p>{{ (searchQuery || selectedCategory) ? t('products.emptyFiltered') : t('products.empty') }}</p>
          <Button v-if="searchQuery || selectedCategory" variant="outline" size="sm" class="mt-2 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15" @click="resetFilters">{{ t('products.clearFilters') }}</Button>
        </div>
      </section>
    </div>

    <ProductQuickBuy
      v-if="quickBuyProduct"
      :product="quickBuyProduct"
      :visible="quickBuyVisible"
      @update:visible="quickBuyVisible = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight, PackageOpen, Search, SearchX, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useProductList } from '../../composables/useProductList'
import { useProductListGroups } from '../../composables/useProductListGroups'
import { usePageSeo } from '../../composables/usePageSeo'
import { useLocalized } from '../../composables/useProduct'
import type { PublicCategory } from '../../utils/category'
import VaultCategorySidebar from './components/VaultCategorySidebar.vue'
import VaultProductListItem from './components/VaultProductListItem.vue'
import ProductQuickBuy from '../../components/ProductQuickBuy.vue'
import { getImageUrl } from '../../utils/image'

const { t } = useI18n()
const route = useRoute()
const { getLocalizedText } = useLocalized()

const quickBuyProduct = ref<any>(null)
const quickBuyVisible = ref(false)
const openQuickBuy = (product: any) => {
  quickBuyProduct.value = product
  quickBuyVisible.value = true
}

const {
  loading,
  products,
  selectedCategory,
  searchQuery,
  currentPage,
  totalPages,
  expandedParentIds,
  categoryGroups,
  categoryMap,
  selectCategory,
  toggleParentCategory,
  changePage,
  clearSearch,
  initialize,
  cleanup,
} = useProductList({ pageSize: 12, homeRouteName: 'products' })

const productGroups = useProductListGroups(products, categoryMap)

const catName = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''

const selectedCategoryName = computed(() => {
  if (!selectedCategory.value) return ''
  const cat = categoryMap.value.get(selectedCategory.value)
  return cat ? catName(cat) : ''
})

const pageTitle = computed(() => {
  if (route.name === 'category-products') return selectedCategoryName.value || t('nav.products')
  return t('nav.products')
})

// 分页窗口：当前页前后各 2 页
const pageWindow = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const start = Math.max(1, cur - 2)
  const end = Math.min(total, start + 4)
  const realStart = Math.max(1, end - 4)
  const pages: number[] = []
  for (let p = realStart; p <= end; p++) pages.push(p)
  return pages
})

const resetFilters = () => {
  clearSearch()
  selectCategory(null)
}

usePageSeo({
  canonicalPath: () => route.path,
  title: () => pageTitle.value,
})

onMounted(() => { void initialize() })
onUnmounted(() => cleanup())
</script>
