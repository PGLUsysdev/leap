<?php

namespace App\Http\Requests;

use App\Models\Ppa;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $allowed = array_keys(config('ppa.type_padding', []));

        return [
            'office_id' => 'required|exists:offices,id',
            'parent_id' => 'nullable|exists:ppas,id',
            'name' => 'required|string',
            'type' => ['required', 'string', Rule::in($allowed)],
            'code_suffix' => 'nullable|string|max:10',
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

                // Dynamic parent type validation based on config
                $allowed = array_keys(config('ppa.type_padding', []));
                $typeIndex = array_search($type, $allowed);
                $expectedParent = ($typeIndex !== false && $typeIndex > 0)
                    ? $allowed[$typeIndex - 1]
                    : null;

                if ($expectedParent === null || $parent->type !== $expectedParent) {
                    $expectedLabel = $expectedParent ?? 'none';
                    $validator
                        ->errors()
                        ->add(
                            'parent_id',
                            "A {$type} can only be moved under a {$expectedLabel}.",
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
