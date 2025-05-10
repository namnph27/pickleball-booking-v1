<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import { useCourtStore } from '../../store/court';
import { useValidation } from '../../composables/useValidation';
import { useToast } from '../../composables/useToast';
import { useUploadService } from '../../services/UploadService';
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
const uploadService = useUploadService();

// State
const isEditMode = computed(() => !!route.params.id);
const courtId = computed(() => Number(route.params.id));
const isSubmitting = ref(false);
const formError = ref('');
const imageFile = ref<File | null>(null);
const imagePreview = ref('');
const isDevelopment = ref(import.meta.env.DEV || false);

// Form state (reactive variables)
const courtName = ref('');
const courtLocation = ref('');
const courtDistrict = ref('');
const courtDescription = ref('');
const courtIsAvailable = ref(true);

// Danh sách các quận của TP.HCM
const districtOptions = [
  { value: 'quan_1', label: 'Quận 1' },
  { value: 'quan_3', label: 'Quận 3' },
  { value: 'quan_4', label: 'Quận 4' },
  { value: 'quan_5', label: 'Quận 5' },
  { value: 'quan_6', label: 'Quận 6' },
  { value: 'quan_7', label: 'Quận 7' },
  { value: 'quan_8', label: 'Quận 8' },
  { value: 'quan_10', label: 'Quận 10' },
  { value: 'quan_11', label: 'Quận 11' },
  { value: 'quan_12', label: 'Quận 12' },
  { value: 'binh_thanh', label: 'Quận Bình Thạnh' },
  { value: 'phu_nhuan', label: 'Quận Phú Nhuận' },
  { value: 'go_vap', label: 'Quận Gò Vấp' },
  { value: 'tan_binh', label: 'Quận Tân Bình' },
  { value: 'tan_phu', label: 'Quận Tân Phú' },
  { value: 'thu_duc', label: 'Thành phố Thủ Đức' },
  { value: 'binh_tan', label: 'Quận Bình Tân' }
];

// Form validation
const { handleSubmit, errors, values, resetForm, setFieldValue } = useForm({
  validationSchema: courtSchema,
  initialValues: {
    name: '',
    location: '',
    district: '',
    description: '',
    is_available: true
  }
});

// Sync form values with reactive variables
watch(() => values.name, (newValue) => {
  if (newValue !== courtName.value) {
    courtName.value = newValue;
  }
});

watch(() => values.location, (newValue) => {
  if (newValue !== courtLocation.value) {
    courtLocation.value = newValue;
  }
});

watch(() => values.district, (newValue) => {
  if (newValue !== courtDistrict.value) {
    courtDistrict.value = newValue;
  }
});

watch(() => values.description, (newValue) => {
  if (newValue !== courtDescription.value) {
    courtDescription.value = newValue;
  }
});

watch(() => values.is_available, (newValue) => {
  if (newValue !== courtIsAvailable.value) {
    courtIsAvailable.value = newValue;
  }
});

// Sync reactive variables with form values
watch(courtName, (newValue) => {
  if (newValue !== values.name) {
    setFieldValue('name', newValue);
  }
});

watch(courtLocation, (newValue) => {
  if (newValue !== values.location) {
    setFieldValue('location', newValue);
  }
});

watch(courtDistrict, (newValue) => {
  if (newValue !== values.district) {
    setFieldValue('district', newValue);
  }
});

watch(courtDescription, (newValue) => {
  if (newValue !== values.description) {
    setFieldValue('description', newValue);
  }
});

watch(courtIsAvailable, (newValue) => {
  if (newValue !== values.is_available) {
    setFieldValue('is_available', newValue);
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
    // Get district label for display
    const districtLabel = districtOptions.find(d => d.value === courtDistrict.value)?.label || '';

    // Upload image if selected
    let imageUrl = null;
    if (imageFile.value) {
      try {
        console.log('Uploading image file:', imageFile.value.name);
        toast.info(t('courtOwner.uploadingImage'));
        imageUrl = await uploadService.uploadFile(imageFile.value, 'court');
        console.log('Image uploaded successfully:', imageUrl);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast.error(t('courtOwner.imageUploadError'));
        // Continue with form submission even if image upload fails
      }
    }

    // Use reactive variables instead of form values
    const courtData = {
      name: courtName.value,
      location: courtLocation.value,
      district: courtDistrict.value,
      description: courtDescription.value,
      is_available: courtIsAvailable.value,
      district_name: districtLabel,
      // Set a default hourly_rate of 0 - will be configured in time slots
      hourly_rate: 0,
      // Add image URL if uploaded
      image_url: imageUrl || (isEditMode.value ? courtStore.currentCourt?.image_url : null)
    };

    console.log('Submitting court data:', courtData);

    let newCourtId;

    if (isEditMode.value) {
      // Update existing court
      const updatedCourt = await courtStore.updateCourt(courtId.value, courtData);
      console.log('Court updated:', updatedCourt);
      toast.success(t('courtOwner.courtUpdated'));
      router.push('/owner/courts');
    } else {
      // Create new court
      const newCourt = await courtStore.createCourt(courtData);
      console.log('New court created:', newCourt);
      newCourtId = newCourt.id;
      toast.success(t('courtOwner.courtCreated'));

      // Redirect to time slot pricing page
      router.push(`/owner/courts/${newCourtId}/timeslots`);
    }
  } catch (error) {
    console.error('Error submitting court form:', error);
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
      console.log('Fetching court with ID:', courtId.value);

      // Fetch court data
      const courtData = await courtStore.getCourtById(courtId.value);

      if (courtData && courtStore.currentCourt) {
        console.log('Court data received:', courtStore.currentCourt);

        // Wait a moment to ensure the store is updated
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create form data object with default values for any missing fields
        const formData = {
          name: courtStore.currentCourt.name || '',
          location: courtStore.currentCourt.location || '',
          district: courtStore.currentCourt.district || '',
          description: courtStore.currentCourt.description || '',
          is_available: courtStore.currentCourt.is_available !== undefined ? courtStore.currentCourt.is_available : true
        };

        console.log('Setting form data:', formData);

        // Set reactive variables directly
        courtName.value = formData.name;
        courtLocation.value = formData.location;
        courtDistrict.value = formData.district;
        courtDescription.value = formData.description;
        courtIsAvailable.value = formData.is_available;

        // Reset form with the data
        resetForm(formData);

        // Set image preview if available
        if (courtStore.currentCourt.image_url) {
          console.log('Setting image preview:', courtStore.currentCourt.image_url);
          // If image URL starts with /uploads, it's a server-side image
          if (courtStore.currentCourt.image_url.startsWith('/uploads')) {
            // Use the API URL from environment variables
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            imagePreview.value = `${apiUrl}${courtStore.currentCourt.image_url}`;
          } else {
            imagePreview.value = courtStore.currentCourt.image_url;
          }
        }

        // Log form values after setting
        console.log('Form values after setting:', values);

        // Force a re-render by toggling a reactive property
        const temp = isSubmitting.value;
        isSubmitting.value = true;
        await new Promise(resolve => setTimeout(resolve, 10));
        isSubmitting.value = temp;
      } else {
        console.error('Court data not found');
        toast.error(t('courtOwner.courtNotFound'));
      }
    } catch (error) {
      console.error('Error fetching court:', error);
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
    :loading="courtStore.loading"
  >
    <div v-if="courtStore.loading" class="loading-container">
      <div class="loading-spinner">
        <i class="pi pi-spin pi-spinner"></i>
        <p>{{ t('common.loading') }}</p>
      </div>
    </div>

    <div v-else class="court-form-container">
      <BaseCard>
        <div v-if="formError" class="form-error">
          <BaseAlert type="error" :message="formError" />
        </div>

        <div v-if="isEditMode && !courtStore.currentCourt" class="form-error">
          <BaseAlert type="error" :message="t('courtOwner.courtNotFound')" />
          <div class="error-actions">
            <BaseButton
              type="button"
              :label="t('common.backToList')"
              variant="primary"
              @click="router.push('/owner/courts')"
            />
          </div>
        </div>

        <form v-else @submit.prevent="onSubmit" class="court-form">
          <div class="form-grid">
            <!-- Court Details -->
            <div class="form-section">
              <h3 class="section-title">{{ t('courtOwner.courtDetails') }}</h3>

              <div class="form-group">
                <BaseInput
                  v-model="courtName"
                  name="name"
                  :label="t('courts.name')"
                  :placeholder="t('courtOwner.courtNamePlaceholder')"
                  :error="errors.name"
                  required
                />
              </div>

              <div class="form-group">
                <BaseInput
                  v-model="courtLocation"
                  name="location"
                  :label="t('courts.location')"
                  :placeholder="t('courtOwner.locationPlaceholder')"
                  :error="errors.location"
                  required
                />
              </div>

              <div class="form-group">
                <BaseSelect
                  v-model="courtDistrict"
                  name="district"
                  :label="t('courts.district')"
                  :options="districtOptions"
                  :placeholder="t('courtOwner.districtPlaceholder')"
                  :error="errors.district"
                  required
                />
              </div>

              <div class="form-group">
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      v-model="courtIsAvailable"
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
                v-model="courtDescription"
                name="description"
                :label="t('courts.description')"
                :placeholder="t('courtOwner.descriptionPlaceholder')"
                :error="errors.description"
                rows="5"
              />
            </div>
          </div>

          <!-- Debug Info - Chỉ hiển thị khi cần debug
          <div v-if="false" class="debug-info">
            <h4>Debug Info</h4>
            <pre>{{ JSON.stringify({
              isEditMode: isEditMode,
              courtId: courtId,
              currentCourt: courtStore.currentCourt,
              formValues: values
            }, null, 2) }}</pre>
          </div>
          -->

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
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;

  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;

    i {
      font-size: 2rem;
      color: var(--primary-color);
      margin-bottom: 1rem;
    }

    p {
      font-size: 1rem;
      color: var(--dark-gray);
    }
  }
}

.court-form-container {
  max-width: 900px;
  margin: 0 auto;
}

.form-error {
  margin-bottom: 1.5rem;

  .error-actions {
    margin-top: 1rem;
    display: flex;
    justify-content: flex-start;
  }
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

  .debug-info {
    margin-top: 2rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 8px;

    h4 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      font-size: 1rem;
      color: var(--dark-gray);
    }

    pre {
      margin: 0;
      font-size: 0.75rem;
      white-space: pre-wrap;
      overflow-x: auto;
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
