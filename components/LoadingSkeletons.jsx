import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Skeleton loader animation class
 */
const skeletonClass = "animate-pulse bg-gray-200 rounded";

/**
 * Loading skeleton for a game card
 */
export function GameCardSkeleton() {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4">
        {/* Date/Time Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className={cn(skeletonClass, "h-3 w-20 mb-2")} />
            <div className={cn(skeletonClass, "h-6 w-16")} />
          </div>
          <div className={cn(skeletonClass, "h-6 w-14 rounded-full")} />
        </div>

        {/* Teams */}
        <div className="mb-3">
          <div className={cn(skeletonClass, "h-6 w-32 mb-2")} />
        </div>

        {/* Jersey Colors */}
        <div className="flex gap-2 mb-3">
          <div className={cn(skeletonClass, "h-8 w-20")} />
          <div className={cn(skeletonClass, "h-8 w-20")} />
        </div>

        {/* Location */}
        <div className="mb-3">
          <div className={cn(skeletonClass, "h-4 w-48")} />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <div className={cn(skeletonClass, "h-10 flex-1")} />
          <div className={cn(skeletonClass, "h-10 flex-1")} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for the home page hero card
 */
export function HeroCardSkeleton() {
  return (
    <Card className="bg-linear-to-br from-primary-green to-primary-green-light text-white overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className={cn(skeletonClass, "h-4 w-24 bg-white/20")} />
          <div className={cn(skeletonClass, "h-6 w-16 bg-white/20 rounded-full")} />
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div className={cn(skeletonClass, "w-15 h-15 bg-white/20 rounded-full mb-2 mx-auto")} />
            <div className={cn(skeletonClass, "h-4 w-20 bg-white/20 mx-auto")} />
          </div>
          <div className="text-center">
            <div className={cn(skeletonClass, "w-15 h-15 bg-white/20 rounded-full mb-2 mx-auto")} />
            <div className={cn(skeletonClass, "h-4 w-20 bg-white/20 mx-auto")} />
          </div>
        </div>

        {/* Countdown */}
        <div className="flex gap-2 justify-center mb-6">
          <div className={cn(skeletonClass, "h-16 w-20 bg-white/20 rounded-xl")} />
          <div className={cn(skeletonClass, "h-16 w-20 bg-white/20 rounded-xl")} />
          <div className={cn(skeletonClass, "h-16 w-20 bg-white/20 rounded-xl")} />
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className={cn(skeletonClass, "h-4 w-40 bg-white/20")} />
          <div className={cn(skeletonClass, "h-4 w-48 bg-white/20")} />
          <div className={cn(skeletonClass, "h-4 w-36 bg-white/20")} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for stats cards
 */
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className={cn(skeletonClass, "h-4 w-16 mb-2")} />
        <div className={cn(skeletonClass, "h-8 w-24 mb-1")} />
        <div className={cn(skeletonClass, "h-3 w-32")} />
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for schedule page
 */
export function SchedulePageSkeleton() {
  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="px-4 py-6">
        <div className={cn(skeletonClass, "h-8 w-32 mb-6")} />

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <div className={cn(skeletonClass, "h-10 w-24")} />
          <div className={cn(skeletonClass, "h-10 w-24")} />
          <div className={cn(skeletonClass, "h-10 w-24")} />
        </div>

        {/* Game cards */}
        <div className="space-y-3">
          <GameCardSkeleton />
          <GameCardSkeleton />
          <GameCardSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for a generic page
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="px-4 py-6">
        <div className={cn(skeletonClass, "h-8 w-48 mb-4")} />
        <div className={cn(skeletonClass, "h-4 w-full mb-2")} />
        <div className={cn(skeletonClass, "h-4 w-3/4 mb-2")} />
        <div className={cn(skeletonClass, "h-4 w-5/6")} />
      </div>
    </div>
  );
}
