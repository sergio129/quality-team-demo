import { useState } from 'react';

export interface JiraOption {
  value: string;
  label: string;
}

export const useJiraIdSuggestions = () => {
  const [loading, setLoading] = useState(false);

  const searchJiraIds = async (inputValue: string): Promise<JiraOption[]> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jira-search?query=${encodeURIComponent(inputValue)}`);
      if (response.ok) {
        const data = await response.json();
        return data.map((id: string) => ({
          value: id,
          label: id,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching JIRA suggestions:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { searchJiraIds, loading };
};
