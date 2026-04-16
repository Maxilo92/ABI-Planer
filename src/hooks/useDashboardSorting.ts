import { useMemo } from 'react';
import {
  Profile,
  Todo,
  Event,
  Poll,
  NewsEntry,
  DashboardComponentKey
} from '../types/database';

export function useDashboardSorting(
  profile: Profile | null,
  todos: Todo[],
  events: Event[],
  polls: Poll[],
  news: NewsEntry[]
): DashboardComponentKey[] {
  return useMemo(() => {
    // Guest View: News first, then Funding, then Polls (stable order)
    if (!profile) {
      return ['news', 'funding', 'polls'];
    }

    // If the user has a custom layout, use it.
    if (profile.dashboard_layout && profile.dashboard_layout.length > 0) {
      return profile.dashboard_layout;
    }

    // Authenticated View: Original logic with stabilization
    // Use a fixed baseline to avoid jumping during initial load
    const componentKeys: DashboardComponentKey[] = [
      'todos',
      'events',
      'polls',
      'funding',
      'news',
      'leaderboard'
    ];

    const scores: Record<DashboardComponentKey, number> = {
      todos: 0,
      events: 0,
      polls: 0,
      funding: 0,
      news: 0,
      leaderboard: 40, // Baseline for ranking
    };

    // Only apply dynamic scores if we have data (stabilization)
    // If all inputs are empty, we might be in initial loading phase.
    // We use a baseline order instead of jumping around.
    const isInitialLoad = todos.length === 0 && events.length === 0 && polls.length === 0 && news.length === 0;
    
    if (isInitialLoad) {
      return componentKeys; // Stable baseline during load
    }

    // Todos Score: +100 if user has an open todo assigned to them, their group, or their class.
    const hasOpenTodo = todos.some(todo => 
      (todo.status === 'open' || todo.status === 'in_progress') && 
      (
        todo.assigned_to_user === profile.id ||
        (profile.planning_groups && todo.assigned_to_group && profile.planning_groups.includes(todo.assigned_to_group)) ||
        (profile.class_name && todo.assigned_to_class === profile.class_name)
      )
    );
    if (hasOpenTodo) scores.todos = 100;

    // Events Score: +80 if an event is occurring within the next 3 days.
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const now = new Date();

    const hasUpcomingEvent = events.some(event => {
      const startDate = new Date(event.start_date);
      return startDate >= now && startDate <= threeDaysFromNow;
    });
    if (hasUpcomingEvent) scores.events = 80;

    // Polls Score: +70 if an active poll exists that the user hasn't voted in.
    const hasUnvotedPoll = polls.some(poll => 
      poll.is_active && (!poll.votes || !poll.votes.some(vote => vote.user_id === profile.id))
    );
    if (hasUnvotedPoll) scores.polls = 70;

    // Finances (Funding) Score: +50 for 'planner' or 'admin' roles.
    const isAdminOrPlanner = profile.role === 'planner' || 
                             profile.role === 'admin' || 
                             profile.role === 'admin_main' || 
                             profile.role === 'admin_co';
    if (isAdminOrPlanner) scores.funding = 50;

    // News Score: +30 if news were posted in the last 24 hours.
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const hasRecentNews = news.some(entry => {
      const createdAt = new Date(entry.created_at);
      return createdAt >= twentyFourHoursAgo;
    });
    if (hasRecentNews) scores.news = 30;

    return componentKeys.sort((a, b) => scores[b] - scores[a]);
  }, [profile, todos, events, polls, news]);
}
