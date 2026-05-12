import { Language } from './types/execution.types'

export const allowedLanguages: Language[] = [
  Language.PYTHON,
  Language.JAVA,
  Language.CPP,
  Language.C,
]

export const languageLabels: Record<Language, string> = {
  [Language.PYTHON]: 'Python',
  [Language.JAVA]: 'Java',
  [Language.CPP]: 'C++',
  [Language.C]: 'C',
}

export const monacoLanguageMap: Record<Language, string> = {
  [Language.JAVA]: 'java',
  [Language.PYTHON]: 'python',
  [Language.CPP]: 'cpp',
  [Language.C]: 'c',
}

export const languageTemplateMap: Record<Language, string> = {
  [Language.PYTHON]: `def solution():
    pass
`,
  [Language.JAVA]: `class Solution {

}
`,
  [Language.CPP]: `#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
`,
  [Language.C]: `#include <stdio.h>

int main(void) {
  return 0;
}
`,
}

export const initialTestCases: string[] = ['5', '10']

export const defaultRequesterId = 1
export const defaultAssignmentId = 10

export const mockProblem = {
  title: 'Binary Search Implementation',
  subtitle: 'Data Structures · Binary Search',
  statement:
    'Implement a binary search algorithm that finds the position of a target value within a sorted array. Binary search compares the target value to the middle element of the array. If they are not equal, the half in which the target cannot lie is eliminated and the search continues on the remaining half.',
  examples: [
    {
      title: 'Example 1',
      input: 'arr = [1,3,5,7,9], target = 7',
      output: '3',
    },
    {
      title: 'Example 2',
      input: 'arr = [1,3,5,7,9], target = 4',
      output: '-1',
    },
  ],
  constraints: [
    '1 ≤ n ≤ 10^5',
    '-10^9 ≤ arr[i] ≤ 10^9',
    'arr is sorted in non-decreasing order',
    'Return -1 when the target is not present',
  ],
  tags: ['Binary Search', 'Arrays', 'Searching'],
}
