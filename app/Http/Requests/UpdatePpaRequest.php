<?php

namespace App\Http\Requests;

use App\Models\Ppa;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePpaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'office_id' => 'required|exists:offices,id',
            'parent_id' => 'nullable|exists:ppas,id',
            'name' => 'required|string',
            'type' => 'required|in:Program,Project,Activity,Sub-Activity',
            'code_suffix' => 'nullable|string|max:10', // Increased to accommodate dynamic Sub-Activity
            'is_active' => 'boolean',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $parentId = $this->input('parent_id');
            $type = $this->input('type');
            $ppaId = $this->route('ppa');

            // Type validation: ensure parent type matches child type requirements
            if ($parentId !== null && $type) {
                $parent = Ppa::find($parentId);

                if (! $parent) {
                    return;
                }

                // Prevent self-referencing or moving to own descendant
                if ($this->isDescendant($ppaId, $parentId)) {
                    $validator
                        ->errors()
                        ->add(
                            'parent_id',
                            'Cannot move to a descendant of itself.',
                        );

                    return;
                }

                // Validate parent type based on child type
                $validParentTypes = match ($type) {
                    'Project' => ['Program'],
                    'Activity' => ['Project'],
                    'Sub-Activity' => ['Activity'],
                    'Program' => [], // Programs cannot have a parent
                    default => [],
                };

                if (! in_array($parent->type, $validParentTypes)) {
                    $expectedParent = match ($type) {
                        'Project' => 'Program',
                        'Activity' => 'Project',
                        'Sub-Activity' => 'Activity',
                        default => 'none',
                    };
                    $validator
                        ->errors()
                        ->add(
                            'parent_id',
                            "A {$type} can only be moved under a {$expectedParent}.",
                        );
                }
            }
        });
    }

    /**
     * Check if targetId is a descendant of sourceId.
     */
    private function isDescendant($sourceId, $targetId): bool
    {
        $current = Ppa::find($targetId);
        $visited = [];

        while (
            $current &&
            $current->parent_id &&
            ! in_array($current->id, $visited)
        ) {
            $visited[] = $current->id;

            if ($current->parent_id == $sourceId) {
                return true;
            }

            $current = Ppa::find($current->parent_id);
        }

        return false;
    }
}
