import '@cmu-sei/sds-lite/react'
import type { SdsTabsChangeDetail } from '@cmu-sei/sds-lite'
import type { SdsTabsProps as SdsVueTabsProps } from '@cmu-sei/sds-lite/vue'

const handleChange = (event: CustomEvent<SdsTabsChangeDetail>) => {
  event.detail.value.toUpperCase()
}

const tabs = (
  <sds-tabs
    value="overview"
    activation="manual"
    orientation="vertical"
    size="lg"
    tone="accent"
    variant="underline"
    onsds-change={handleChange}
  />
)

const vueTabs: SdsVueTabsProps = {
  value: 'overview',
  activation: 'automatic',
  orientation: 'horizontal',
  size: 'md',
  tone: 'neutral',
  variant: 'folder',
  onSdsChange: handleChange,
}

void tabs
void vueTabs
