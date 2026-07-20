from sqlalchemy.orm import Session
from models import Threat, ActionLog
from sqlalchemy import func
import datetime

class AnalyticsService:
    @staticmethod
    def get_tenant_threat_trends(db: Session, tenant_id: int, days: int = 30):
        # Calcula la fecha de inicio para el análisis
        start_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        
        # Agrupa amenazas por tipo en los últimos X días
        trends = db.query(
            Threat.threat_type, 
            func.count(Threat.id).label("total")
        ).filter(
            Threat.tenant_id == tenant_id,
            Threat.detected_at >= start_date
        ).group_by(Threat.threat_type).all()
        
        return [{"threat_type": t.threat_type, "count": t.total} for t in trends]

    @staticmethod
    def get_action_success_rate(db: Session, tenant_id: int):
        # Calcula qué tan exitosas han sido nuestras respuestas automáticas
        total = db.query(ActionLog).filter(ActionLog.tenant_id == tenant_id).count()
        success = db.query(ActionLog).filter(
            ActionLog.tenant_id == tenant_id, 
            ActionLog.status == "SUCCESS"
        ).count()
        
        return {"total_actions": total, "success_rate": (success/total*100) if total > 0 else 0}

    @staticmethod
    def get_analytics_context(db: Session, tenant_id: int):
        """
        Prepara un resumen de contexto narrativo para que la IA pueda 
        redactar el reporte ejecutivo.
        """
        trends = AnalyticsService.get_tenant_threat_trends(db, tenant_id)
        stats = AnalyticsService.get_action_success_rate(db, tenant_id)
        
        # Formateamos los datos para el prompt de la IA
        context = f"""
        Resumen de seguridad para el tenant {tenant_id}:
        - Estadísticas de respuesta: {stats['success_rate']:.2f}% de éxito en acciones automáticas sobre {stats['total_actions']} eventos.
        - Tendencias de ataques (últimos 30 días):
        """
        for t in trends:
            context += f" * Tipo: {t['threat_type']}, Cantidad: {t['count']}\n"
        
        context += "\nAnaliza esto y redacta un reporte ejecutivo breve resaltando los riesgos principales."
        return context