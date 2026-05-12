import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/shared/components/ui/Select'

import { allowedLanguages, languageLabels } from '../../data'
import { useWorkspaceStore } from '../../store/workspace.store'
import { Language } from '../../types/execution.types'

export function LanguageSelector() {
  const language = useWorkspaceStore((state) => state.language)
  const setLanguage = useWorkspaceStore((state) => state.setLanguage)

  return (
    <div className="w-[180px]">
      <Select
        value={language}
        onValueChange={(value) => setLanguage(value as Language)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {allowedLanguages.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {languageLabels[lang]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
