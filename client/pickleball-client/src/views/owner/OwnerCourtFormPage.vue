<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import { useCourtStore } from '../../store/court';
import { useValidation } from '../../composables/useValidation';
import { useToast } from '../../composables/useToast';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseInput from '../../components/base/BaseInput.vue';
import BaseSelect from '../../components/base/BaseSelect.vue';
import BaseTextarea from '../../components/base/BaseTextarea.vue';
import BaseCard from '../../components/base/BaseCard.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const courtStore = useCourtStore();
const { courtSchema } = useValidation();
const toast = useToast();

// State
const isEditMode = computed(() => !!route.params.id);
const courtId = computed(() => Number(route.params.id));
const isSubmitting = ref(false);
const formError = ref('');
const imageFile = ref<File | null>(null);
const imagePreview = ref('');

// Skill level options
const skillLevelOptions = [
  { value: 'beginner', label: t('common.beginner') },
  { value: 'intermediate', label: t('common.intermediate') },
  { value: 'advanced', label: t('common.advanced') },
  { value: 'allLevels', label: t('common.allLevels') }
];

// Form validation
const { handleSubmit, errors, values, resetForm, setFieldValue } = useForm({
  validationSchema: courtSchema,
  initialValues: {
    name: '',
    location: '',
    hourly_rate: '',
    description: '',
    skill_level: 'allLevels',
    is_available: true
  }
});

// Handle image upload
const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    imageFile.value = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// Remove image
const removeImage = () => {
  imageFile.value = null;
  imagePreview.value = '';
};

// Submit form
const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true;
  formError.value = '';
  
  try {
    const courtData = {
      ...formValues,
      hourly_rate: Number(formValues.hourly_rate)
    };
    
    if (isEditMode.value) {
      // Update existing court
      await courtStore.updateCourt(courtId.value, courtData);
      toast.success(t('courtOwner.courtUpdated'));
    } else {
      // Create new court
      await courtStore.createCourt(courtData);
      toast.success(t('courtOwner.courtCreated'));
    }
    
    // Redirect to courts list
    router.push('/owner/courts');
  } catch (error) {
    formError.value = typeof error === 'string' ? error : t('courtOwner.saveError');
  } finally {
    isSubmitting.value = false;
  }
});

// Cancel form
const cancelForm = () => {
  router.push('/owner/courts');
};

// Fetch court details if in edit mode
onMounted(async () => {
  if (isEditMode.value) {
    try {
      await courtStore.getCourtById(courtId.value);
      
      if (courtStore.currentCourt) {
        // Populate form with court data
        resetForm({
          name: courtStore.currentCourt.name,
          location: courtStore.currentCourt.location,
          hourly_rate: courtStore.currentCourt.hourly_rate.toString(),
          description: courtStore.currentCourt.description || '',
          skill_level: courtStore.currentCourt.skill_level,
          is_available: courtStore.currentCourt.is_available
        });
        
        // Set image preview if available
        if (courtStore.currentCourt.image_url) {
          imagePreview.value = courtStore.currentCourt.image_url;
        }
      }
    } catch (error) {
      toast.error(typeof error === 'string' ? error : t('courtOwner.fetchError'));
      router.push('/owner/courts');
    }
  }
});
</script>

<template>
  <BaseLayout 
    :title="isEditMode ? t('courtOwner.editCourt') : t('courtOwner.addCourt')"
    :back-link="'/owner/courts'"
  >
    <div class="court-form-container">
      <BaseCard>
        <div v-if="formError" class="form-error">
          <BaseAlert type="error" :message="formError" />
        </div>
        
        <form @submit.prevent="onSubmit" class="court-form">
          <div class="form-grid">
            <!-- Court Details -->
            <div class="form-section">
              <h3 class="section-title">{{ t('courtOwner.courtDetails') }}</h3>
              
              <div class="form-group">
                <BaseInput
                  v-model="values.name"
                  name="name"
                  :label="t('courts.name')"
                  :placeholder="t('courtOwner.courtNamePlaceholder')"
                  :error="errors.name"
                  required
                />
              </div>
              
              <div class="form-group">
                <BaseInput
                  v-model="values.location"
                  name="location"
                  :label="t('courts.location')"
                  :placeholder="t('courtOwner.locationPlaceholder')"
                  :error="errors.location"
                  required
                />
              </div>
              
              <div class="form-group">
                <BaseInput
                  v-model="values.hourly_rate"
                  name="hourly_rate"
                  type="number"
                  :label="t('courts.hourlyRate')"
                  :placeholder="t('courtOwner.hourlyRatePlaceholder')"
                  :error="errors.hourly_rate"
                  required
                />
              </div>
              
              <div class="form-group">
                <BaseSelect
                  v-model="values.skill_level"
                  name="skill_level"
                  :label="t('common.skillLevel')"
                  :options="skillLevelOptions"
                  :error="errors.skill_level"
                  required
                />
              </div>
              
              <div class="form-group">
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      v-model="values.is_available"
                      name="is_available"
                    />
                    <span>{{ t('courtOwner.courtAvailable') }}</span>
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Court Image -->
            <div class="form-section">
              <h3 class="section-title">{{ t('courtOwner.courtImage') }}</h3>
              
              <div class="image-upload">
                <div 
                  v-if="imagePreview" 
                  class="image-preview"
                >
                  <img :src="imagePreview" alt="Court preview" />
                  
                  <button 
                    type="button" 
                    class="remove-image" 
                    @click="removeImage"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>
                
                <div v-else class="upload-placeholder">
                  <i class="pi pi-image"></i>
                  <p>{{ t('courtOwner.uploadImage') }}</p>
                  <span>{{ t('courtOwner.imageRequirements') }}</span>
                  
                  <input 
                    type="file" 
                    id="court-image" 
                    accept="image/*"
                    @change="handleImageUpload"
                    class="file-input"
                  />
                  
                  <label for="court-image" class="upload-button">
                    {{ t('courtOwner.selectImage') }}
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Court Description -->
          <div class="form-section">
            <h3 class="section-title">{{ t('courts.description') }}</h3>
            
            <div class="form-group">
              <BaseTextarea
                v-model="values.description"
                name="description"
                :label="t('courts.description')"
                :placeholder="t('courtOwner.descriptionPlaceholder')"
                :error="errors.description"
                rows="5"
              />
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="form-actions">
            <BaseButton
              type="button"
              :label="t('common.cancel')"
              variant="outline"
              @click="cancelForm"
            />
            
            <BaseButton
              type="submit"
              :label="isEditMode ? t('courtOwner.updateCourt') : t('courtOwner.createCourt')"
              variant="primary"
              :loading="isSubmitting"
            />
          </div>
        </form>
      </BaseCard>
    </div>
  </BaseLayout>
</template>

<style scoped lang="scss">
.court-form-container {
  max-width: 900px;
  margin: 0 auto;
}

.form-error {
  margin-bottom: 1.5rem;
}

.court-form {
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  .form-section {
    margin-bottom: 2rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }
  }
  
  .form-group {
    margin-bottom: 1.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .checkbox-group {
    margin-top: 0.5rem;
    
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      
      input {
        width: 18px;
        height: 18px;
      }
    }
  }
  
  .image-upload {
    .image-preview {
      position: relative;
      width: 100%;
      height: 200px;
      border-radius: 8px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .remove-image {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        
        &:hover {
          background-color: rgba(0, 0, 0, 0.7);
        }
      }
    }
    
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 200px;
      border: 2px dashed var(--medium-gray);
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      
      i {
        font-size: 2rem;
        color: var(--dark-gray);
        margin-bottom: 0.5rem;
      }
      
      p {
        font-weight: 500;
        margin: 0 0 0.25rem 0;
      }
      
      span {
        font-size: 0.75rem;
        color: var(--dark-gray);
        margin-bottom: 1rem;
      }
      
      .file-input {
        display: none;
      }
      
      .upload-button {
        padding: 0.5rem 1rem;
        background-color: var(--light-gray);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        
        &:hover {
          background-color: var(--medium-gray);
        }
      }
    }
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
}

@media (max-width: 768px) {
  .court-form {
    .form-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .form-actions {
      flex-direction: column-reverse;
    }
  }
}
</style>
