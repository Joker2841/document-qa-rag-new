from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from typing import List, Dict, Any
import logging
from collections import Counter # Counter not used in the provided snippets, but kept for context

from app.database import get_db
from app.models.query import (
    QueryHistoryDB, AnalyticsStatsDB,
    AnalyticsStats, PopularQuestion, PopularQuestionsResponse
)
from app.models.document import DocumentDB

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/stats", response_model=AnalyticsStats)
async def get_stats(db: Session = Depends(get_db)):
    """
    Get comprehensive usage statistics.

    Returns:
    - Total queries processed
    - Total documents uploaded
    - Average response time
    - Success/failure rates
    - Most used LLM
    """
    try:
        # Get basic stats from analytics table
        stats = db.query(AnalyticsStatsDB).first()
        if not stats:
            # Initialize if doesn't exist
            stats = AnalyticsStatsDB(
                total_queries=0,
                total_documents=0,
                avg_response_time=0.0
            )
            db.add(stats)
            db.commit()
            db.refresh(stats)

        # Get real-time counts
        total_queries = db.query(QueryHistoryDB).count()
        total_documents = db.query(DocumentDB).count()

        # Get success/failure counts
        successful_queries = db.query(QueryHistoryDB).filter(
            QueryHistoryDB.success == "true"
        ).count()
        failed_queries = total_queries - successful_queries

        # Get most used LLM
        llm_usage = db.query(
            QueryHistoryDB.llm_used,
            func.count(QueryHistoryDB.llm_used).label('count')
        ).filter(
            QueryHistoryDB.llm_used.isnot(None)
        ).group_by(QueryHistoryDB.llm_used).order_by(desc('count')).first()

        top_llm_used = llm_usage[0] if llm_usage else None

        # Calculate real-time average response time
        avg_response_time_result = db.query(
            func.avg(QueryHistoryDB.response_time)
        ).scalar()

        avg_response_time = float(avg_response_time_result) if avg_response_time_result else 0.0

        # Update stats table with real-time data
        stats.total_queries = total_queries
        stats.total_documents = total_documents
        stats.avg_response_time = avg_response_time
        db.commit()

        return AnalyticsStats(
            total_queries=total_queries,
            total_documents=total_documents,
            avg_response_time=avg_response_time,
            successful_queries=successful_queries,
            failed_queries=failed_queries,
            last_updated=stats.last_updated,
            top_llm_used=top_llm_used
        )

    except Exception as e:
        logger.error(f"Error getting analytics stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting analytics stats: {str(e)}")


@router.get("/popular-questions", response_model=PopularQuestionsResponse)
async def get_popular_questions(
    limit: int = Query(10, ge=1, le=50, description="Number of popular questions to return"),
    min_frequency: int = Query(2, ge=1, description="Minimum frequency for a question to be considered popular"),
    db: Session = Depends(get_db)
):
    """
    Get popular questions based on similarity hashing.

    Groups similar questions together and returns the most frequently asked ones
    with their success rates and average response times.
    """
    try:
        # Get questions grouped by similarity hash
        question_groups = db.query(
            QueryHistoryDB.similarity_hash,
            func.count(QueryHistoryDB.similarity_hash).label('frequency'),
            func.avg(QueryHistoryDB.response_time).label('avg_response_time'),
            func.max(QueryHistoryDB.created_at).label('last_asked'),
            func.sum(
                case(
                    (QueryHistoryDB.success == "true", 1),
                    else_=0
                )
            ).label('successful_count')
        ).filter(
            QueryHistoryDB.similarity_hash.isnot(None)
        ).group_by(
            QueryHistoryDB.similarity_hash
        ).having(
            func.count(QueryHistoryDB.similarity_hash) >= min_frequency
        ).order_by(
            desc('frequency')
        ).limit(limit).all()

        popular_questions = []

        for group in question_groups:
            # Get a representative question from this group
            representative_question = db.query(QueryHistoryDB.question).filter(
                QueryHistoryDB.similarity_hash == group.similarity_hash
            ).first()

            if representative_question:
                success_rate = (group.successful_count / group.frequency) * 100 if group.frequency > 0 else 0

                popular_questions.append(PopularQuestion(
                    question=representative_question[0],
                    frequency=group.frequency,
                    avg_response_time=float(group.avg_response_time),
                    success_rate=success_rate,
                    last_asked=group.last_asked
                ))

        # Get total unique questions count
        total_unique_questions = db.query(
            func.count(func.distinct(QueryHistoryDB.similarity_hash))
        ).scalar() or 0

        return PopularQuestionsResponse(
            questions=popular_questions,
            total_unique_questions=total_unique_questions
        )

    except Exception as e:
        logger.error(f"Error getting popular questions: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting popular questions: {str(e)}")


@router.get("/query-trends")
async def get_query_trends(
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """
    Get query trends over time.

    Returns daily query counts and success rates for the specified time period.
    """
    try:
        from datetime import datetime, timedelta

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get daily query counts
        daily_stats = db.query(
            func.date(QueryHistoryDB.created_at).label('date'),
            func.count(QueryHistoryDB.id).label('total_queries'),
            func.sum(
                case(
                    (QueryHistoryDB.success == "true", 1),
                    else_=0
                )
            ).label('successful_queries'),
            func.avg(QueryHistoryDB.response_time).label('avg_response_time')
        ).filter(
            QueryHistoryDB.created_at >= start_date
        ).group_by(
            func.date(QueryHistoryDB.created_at)
        ).order_by(
            func.date(QueryHistoryDB.created_at)
        ).all()

        trends = []
        for stat in daily_stats:
            success_rate = (stat.successful_queries / stat.total_queries * 100) if stat.total_queries > 0 else 0
            trends.append({
                "date": stat.date.strftime("%Y-%m-%d"),
                "total_queries": stat.total_queries,
                "successful_queries": stat.successful_queries,
                "success_rate": round(success_rate, 2),
                "avg_response_time": round(float(stat.avg_response_time), 2)
            })

        return {
            "success": True,
            "period_days": days,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "trends": trends,
            "total_days_with_data": len(trends)
        }

    except Exception as e:
        logger.error(f"Error getting query trends: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting query trends: {str(e)}")


@router.get("/llm-usage")
async def get_llm_usage_stats(db: Session = Depends(get_db)):
    """Get statistics on LLM usage."""
    try:
        llm_stats = db.query(
            QueryHistoryDB.llm_used,
            func.count(QueryHistoryDB.id).label('usage_count')
        ).filter(
            QueryHistoryDB.llm_used.isnot(None)
        ).group_by(
            QueryHistoryDB.llm_used
        ).order_by(
            desc('usage_count')
        ).all()

        usage_dict = {stat.llm_used: stat.usage_count for stat in llm_stats}
        
        return {
            "success": True,
            "llm_usage": usage_dict,
            "top_llm": llm_stats[0].llm_used if llm_stats else None,
            "top_llm_count": llm_stats[0].usage_count if llm_stats else 0
        }
    except Exception as e:
        logger.error(f"Error getting LLM usage stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))