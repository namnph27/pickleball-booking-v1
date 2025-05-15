<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  position: {
    type: String,
    default: 'top',
    validator: (value: string) => ['top', 'bottom', 'left', 'right'].includes(value)
  },
  delay: {
    type: Number,
    default: 0
  },
  maxWidth: {
    type: String,
    default: '200px'
  },
  trigger: {
    type: String,
    default: 'hover',
    validator: (value: string) => ['hover', 'click', 'focus'].includes(value)
  }
});

const tooltipRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const timeoutId = ref<number | null>(null);

const tooltipClasses = computed(() => {
  return [
    'base-tooltip',
    `base-tooltip--${props.position}`,
    isVisible.value ? 'base-tooltip--visible' : ''
  ];
});

const tooltipStyles = computed(() => {
  return {
    maxWidth: props.maxWidth
  };
});

const showTooltip = () => {
  if (props.delay > 0) {
    timeoutId.value = window.setTimeout(() => {
      isVisible.value = true;
      positionTooltip();
    }, props.delay);
  } else {
    isVisible.value = true;
    positionTooltip();
  }
};

const hideTooltip = () => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value);
    timeoutId.value = null;
  }
  isVisible.value = false;
};

const toggleTooltip = () => {
  if (isVisible.value) {
    hideTooltip();
  } else {
    showTooltip();
  }
};

const positionTooltip = () => {
  if (!tooltipRef.value || !triggerRef.value) return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  
  let top = 0;
  let left = 0;
  
  switch (props.position) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - 8;
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      break;
    case 'bottom':
      top = triggerRect.bottom + 8;
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      break;
    case 'left':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
      left = triggerRect.left - tooltipRect.width - 8;
      break;
    case 'right':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
      left = triggerRect.right + 8;
      break;
  }
  
  // Adjust for viewport boundaries
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Ensure tooltip is within horizontal bounds
  if (left < 8) {
    left = 8;
  } else if (left + tooltipRect.width > viewportWidth - 8) {
    left = viewportWidth - tooltipRect.width - 8;
  }
  
  // Ensure tooltip is within vertical bounds
  if (top < 8) {
    top = 8;
  } else if (top + tooltipRect.height > viewportHeight - 8) {
    top = viewportHeight - tooltipRect.height - 8;
  }
  
  tooltipRef.value.style.top = `${top}px`;
  tooltipRef.value.style.left = `${left}px`;
};

const setupEventListeners = () => {
  if (!triggerRef.value) return;
  
  if (props.trigger === 'hover') {
    triggerRef.value.addEventListener('mouseenter', showTooltip);
    triggerRef.value.addEventListener('mouseleave', hideTooltip);
  } else if (props.trigger === 'click') {
    triggerRef.value.addEventListener('click', toggleTooltip);
    document.addEventListener('click', handleOutsideClick);
  } else if (props.trigger === 'focus') {
    triggerRef.value.addEventListener('focus', showTooltip);
    triggerRef.value.addEventListener('blur', hideTooltip);
  }
  
  window.addEventListener('resize', positionTooltip);
  window.addEventListener('scroll', positionTooltip);
};

const removeEventListeners = () => {
  if (!triggerRef.value) return;
  
  if (props.trigger === 'hover') {
    triggerRef.value.removeEventListener('mouseenter', showTooltip);
    triggerRef.value.removeEventListener('mouseleave', hideTooltip);
  } else if (props.trigger === 'click') {
    triggerRef.value.removeEventListener('click', toggleTooltip);
    document.removeEventListener('click', handleOutsideClick);
  } else if (props.trigger === 'focus') {
    triggerRef.value.removeEventListener('focus', showTooltip);
    triggerRef.value.removeEventListener('blur', hideTooltip);
  }
  
  window.removeEventListener('resize', positionTooltip);
  window.removeEventListener('scroll', positionTooltip);
};

const handleOutsideClick = (event: MouseEvent) => {
  if (
    isVisible.value && 
    tooltipRef.value && 
    triggerRef.value && 
    !tooltipRef.value.contains(event.target as Node) && 
    !triggerRef.value.contains(event.target as Node)
  ) {
    hideTooltip();
  }
};

onMounted(() => {
  setupEventListeners();
});

onBeforeUnmount(() => {
  removeEventListeners();
  if (timeoutId.value) {
    clearTimeout(timeoutId.value);
  }
});
</script>

<template>
  <div class="base-tooltip-container">
    <div ref="triggerRef" class="base-tooltip-trigger">
      <slot name="trigger"></slot>
    </div>
    
    <Teleport to="body">
      <div 
        v-if="isVisible" 
        ref="tooltipRef" 
        :class="tooltipClasses" 
        :style="tooltipStyles"
      >
        <div class="base-tooltip__content">
          <slot name="content"></slot>
        </div>
        <div class="base-tooltip__arrow"></div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.base-tooltip-container {
  display: inline-block;
  position: relative;
}

.base-tooltip-trigger {
  display: inline-block;
}

.base-tooltip {
  position: fixed;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.875rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.base-tooltip--visible {
  opacity: 1;
}

.base-tooltip__content {
  position: relative;
  z-index: 1;
}

.base-tooltip__arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  transform: rotate(45deg);
}

.base-tooltip--top .base-tooltip__arrow {
  bottom: -4px;
  left: 50%;
  margin-left: -4px;
}

.base-tooltip--bottom .base-tooltip__arrow {
  top: -4px;
  left: 50%;
  margin-left: -4px;
}

.base-tooltip--left .base-tooltip__arrow {
  right: -4px;
  top: 50%;
  margin-top: -4px;
}

.base-tooltip--right .base-tooltip__arrow {
  left: -4px;
  top: 50%;
  margin-top: -4px;
}
</style>
