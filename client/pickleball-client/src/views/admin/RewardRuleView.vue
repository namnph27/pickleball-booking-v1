<template>
  <div class="reward-rule-view">
    <h1>{{ $t('admin.rewardRules') }}</h1>
    
    <div class="actions">
      <Button 
        :label="$t('admin.createRule')" 
        icon="pi pi-plus" 
        @click="openCreateDialog"
      />
    </div>
    
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>
    
    <div v-else class="rules-table">
      <DataTable 
        :value="rules" 
        :paginator="true" 
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        responsiveLayout="stack"
        breakpoint="960px"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="id" :header="$t('common.id')" sortable style="width: 5%"></Column>
        
        <Column field="name" :header="$t('common.name')" sortable style="width: 15%"></Column>
        
        <Column field="action_type" :header="$t('reward.actionType')" sortable style="width: 15%">
          <template #body="{ data }">
            <Tag :value="formatActionType(data.action_type)" />
          </template>
        </Column>
        
        <Column field="points" :header="$t('reward.points')" sortable style="width: 10%">
          <template #body="{ data }">
            <span v-if="data.is_percentage">{{ data.points }}%</span>
            <span v-else>{{ data.points }}</span>
          </template>
        </Column>
        
        <Column field="is_percentage" :header="$t('reward.isPercentage')" style="width: 10%">
          <template #body="{ data }">
            <i 
              :class="data.is_percentage ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"
            ></i>
          </template>
        </Column>
        
        <Column field="min_amount" :header="$t('reward.minAmount')" style="width: 10%">
          <template #body="{ data }">
            {{ data.min_amount || '-' }}
          </template>
        </Column>
        
        <Column field="max_points" :header="$t('reward.maxPoints')" style="width: 10%">
          <template #body="{ data }">
            {{ data.max_points || '-' }}
          </template>
        </Column>
        
        <Column field="is_active" :header="$t('common.status')" style="width: 10%">
          <template #body="{ data }">
            <Tag 
              :severity="data.is_active ? 'success' : 'danger'" 
              :value="data.is_active ? $t('common.active') : $t('common.inactive')" 
            />
          </template>
        </Column>
        
        <Column :header="$t('common.actions')" style="width: 15%">
          <template #body="{ data }">
            <Button 
              icon="pi pi-pencil" 
              class="p-button-rounded p-button-text p-button-sm" 
              :tooltip="$t('common.edit')"
              @click="openEditDialog(data)"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-rounded p-button-text p-button-danger p-button-sm" 
              :tooltip="$t('common.delete')"
              @click="confirmDelete(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Rule Dialog -->
    <Dialog 
      v-model:visible="ruleDialogVisible" 
      :header="isEditMode ? $t('admin.editRule') : $t('admin.createRule')"
      :style="{ width: '500px' }"
      :modal="true"
      :closable="!submitting"
      :closeOnEscape="!submitting"
    >
      <div class="rule-form">
        <div class="field">
          <label for="name">{{ $t('common.name') }} *</label>
          <InputText 
            id="name" 
            v-model="ruleForm.name" 
            class="w-full" 
            :disabled="submitting"
          />
        </div>
        
        <div class="field">
          <label for="description">{{ $t('common.description') }}</label>
          <Textarea 
            id="description" 
            v-model="ruleForm.description" 
            class="w-full" 
            :disabled="submitting"
            rows="3"
          />
        </div>
        
        <div class="field">
          <label for="action_type">{{ $t('reward.actionType') }} *</label>
          <Dropdown 
            id="action_type" 
            v-model="ruleForm.action_type" 
            :options="actionTypes" 
            optionLabel="label" 
            optionValue="value"
            class="w-full" 
            :disabled="submitting"
          />
        </div>
        
        <div class="field-row">
          <div class="field">
            <label for="points">{{ $t('reward.points') }} *</label>
            <InputNumber 
              id="points" 
              v-model="ruleForm.points" 
              class="w-full" 
              :disabled="submitting"
              :min="0"
            />
          </div>
          
          <div class="field">
            <label for="is_percentage">{{ $t('reward.isPercentage') }}</label>
            <div class="p-field-checkbox">
              <Checkbox 
                id="is_percentage" 
                v-model="ruleForm.is_percentage" 
                :binary="true" 
                :disabled="submitting"
              />
              <label for="is_percentage" class="ml-2">{{ $t('common.yes') }}</label>
            </div>
          </div>
        </div>
        
        <div class="field" v-if="ruleForm.is_percentage">
          <label for="percentage_base">{{ $t('reward.percentageBase') }}</label>
          <Dropdown 
            id="percentage_base" 
            v-model="ruleForm.percentage_base" 
            :options="percentageBases" 
            optionLabel="label" 
            optionValue="value"
            class="w-full" 
            :disabled="submitting"
          />
        </div>
        
        <div class="field-row">
          <div class="field">
            <label for="min_amount">{{ $t('reward.minAmount') }}</label>
            <InputNumber 
              id="min_amount" 
              v-model="ruleForm.min_amount" 
              class="w-full" 
              :disabled="submitting"
              :min="0"
            />
          </div>
          
          <div class="field">
            <label for="max_points">{{ $t('reward.maxPoints') }}</label>
            <InputNumber 
              id="max_points" 
              v-model="ruleForm.max_points" 
              class="w-full" 
              :disabled="submitting"
              :min="0"
            />
          </div>
        </div>
        
        <div class="field">
          <label for="is_active">{{ $t('common.status') }}</label>
          <div class="p-field-checkbox">
            <Checkbox 
              id="is_active" 
              v-model="ruleForm.is_active" 
              :binary="true" 
              :disabled="submitting"
            />
            <label for="is_active" class="ml-2">{{ $t('common.active') }}</label>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          :label="$t('common.cancel')" 
          icon="pi pi-times" 
          @click="ruleDialogVisible = false" 
          class="p-button-text"
          :disabled="submitting"
        />
        <Button 
          :label="$t('common.save')" 
          icon="pi pi-check" 
          @click="saveRule" 
          :loading="submitting"
          :disabled="!isFormValid"
        />
      </template>
    </Dialog>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import ConfirmDialog from 'primevue/confirmdialog';
import { useAdminRewardService } from '@/services/RewardService';

const toast = useToast();
const confirm = useConfirm();
const adminRewardService = useAdminRewardService();

const rules = ref([]);
const loading = ref(false);
const ruleDialogVisible = ref(false);
const isEditMode = ref(false);
const submitting = ref(false);

const ruleForm = ref({
  id: null,
  name: '',
  description: '',
  action_type: '',
  points: 0,
  is_percentage: false,
  percentage_base: 'total_price',
  min_amount: null,
  max_points: null,
  is_active: true
});

const actionTypes = [
  { label: 'Booking Completed', value: 'booking_completed' },
  { label: 'First Booking', value: 'first_booking' },
  { label: 'Referral', value: 'referral' },
  { label: 'Birthday', value: 'birthday' },
  { label: 'Monthly Loyalty', value: 'monthly_loyalty' },
  { label: 'Manual', value: 'manual' }
];

const percentageBases = [
  { label: 'Total Price', value: 'total_price' }
];

const isFormValid = computed(() => {
  return (
    ruleForm.value.name.trim() !== '' &&
    ruleForm.value.action_type !== '' &&
    ruleForm.value.points !== null &&
    ruleForm.value.points >= 0
  );
});

const formatActionType = (actionType: string) => {
  const actionTypeObj = actionTypes.find(type => type.value === actionType);
  return actionTypeObj ? actionTypeObj.label : actionType;
};

const loadRules = async () => {
  try {
    loading.value = true;
    const { rules: rulesData } = await adminRewardService.getRewardRules();
    rules.value = rulesData;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load reward rules',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  isEditMode.value = false;
  ruleForm.value = {
    id: null,
    name: '',
    description: '',
    action_type: '',
    points: 0,
    is_percentage: false,
    percentage_base: 'total_price',
    min_amount: null,
    max_points: null,
    is_active: true
  };
  ruleDialogVisible.value = true;
};

const openEditDialog = (rule: any) => {
  isEditMode.value = true;
  ruleForm.value = { ...rule };
  ruleDialogVisible.value = true;
};

const saveRule = async () => {
  if (!isFormValid.value) return;
  
  try {
    submitting.value = true;
    
    if (isEditMode.value) {
      // Update rule
      const { rule } = await adminRewardService.updateRewardRule(ruleForm.value.id, ruleForm.value);
      
      // Update local state
      const index = rules.value.findIndex((r: any) => r.id === rule.id);
      if (index !== -1) {
        rules.value[index] = rule;
      }
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Reward rule updated successfully',
        life: 3000
      });
    } else {
      // Create rule
      const { rule } = await adminRewardService.createRewardRule(ruleForm.value);
      
      // Update local state
      rules.value.unshift(rule);
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Reward rule created successfully',
        life: 3000
      });
    }
    
    ruleDialogVisible.value = false;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to save reward rule',
      life: 3000
    });
  } finally {
    submitting.value = false;
  }
};

const confirmDelete = (rule: any) => {
  confirm.require({
    message: `Are you sure you want to delete the rule "${rule.name}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteRule(rule.id)
  });
};

const deleteRule = async (id: number) => {
  try {
    await adminRewardService.deleteRewardRule(id);
    
    // Update local state
    rules.value = rules.value.filter((r: any) => r.id !== id);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Reward rule deleted successfully',
      life: 3000
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to delete reward rule',
      life: 3000
    });
  }
};

onMounted(() => {
  loadRules();
});
</script>

<style scoped>
.reward-rule-view {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
}

.actions {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.rules-table {
  margin-bottom: 30px;
}

.rule-form {
  margin-bottom: 20px;
}

.field {
  margin-bottom: 20px;
}

.field-row {
  display: flex;
  gap: 20px;
}

.field-row .field {
  flex: 1;
}

.p-field-checkbox {
  display: flex;
  align-items: center;
  margin-top: 10px;
}
</style>
