import { useQuery } from '@tanstack/react-query';
import { searchService } from '../services/search.service';

export const useSearch = (query: string, page = 1) =>
  useQuery({
    queryKey: ['search', query, page],
    queryFn: () => searchService.search(query, page),
    enabled: query.length > 1,
  });

export const useGenres = () =>
  useQuery({ queryKey: ['genres'], queryFn: searchService.getGenres, staleTime: Infinity });
