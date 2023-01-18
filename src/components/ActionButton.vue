<script lang="ts" setup>

const {icon} = defineProps({
  icon: String

})
</script>
<!-- :class="[`h-[${size}] w-[${size}]`]"-->
<template>
  <FlexboxLayout
      class="text-2xl bg-[#2e343f] text-white rounded-full items-center justify-center"
     >
    <Label
        class="m-icon-round"
        :text="icon"></Label>
  </FlexboxLayout>
</template>
