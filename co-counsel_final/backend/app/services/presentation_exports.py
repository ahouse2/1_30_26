from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO
from typing import Dict, List

from ..config import get_settings
from ..models.api import PresentationExportItemModel
from ..storage.timeline_exports import TimelineExportRecord, TimelineExportStore


class PresentationExportService:
    def __init__(self, export_store: TimelineExportStore | None = None) -> None:
        settings = get_settings()
        export_base = settings.workflow_storage_path / "presentation_exports"
        self.export_store = export_store or TimelineExportStore(export_base)

    def export_binder(
        self,
        *,
        export_format: str,
        binder_id: str | None,
        binder_name: str,
        binder_description: str | None,
        phase: str | None,
        presenter_notes: str | None,
        items: List[PresentationExportItemModel],
    ) -> TimelineExportRecord:
        generated_at = datetime.now(timezone.utc).isoformat()
        filename_base = "_".join((binder_name or "presentation").lower().split()) or "presentation"
        if export_format == "md":
            payload = self._render_markdown(
                binder_name=binder_name,
                binder_description=binder_description,
                phase=phase,
                presenter_notes=presenter_notes,
                items=items,
                generated_at=generated_at,
            ).encode("utf-8")
            filename = f"{filename_base}.md"
        elif export_format == "html":
            payload = self._render_html(
                binder_name=binder_name,
                binder_description=binder_description,
                phase=phase,
                presenter_notes=presenter_notes,
                items=items,
                generated_at=generated_at,
            ).encode("utf-8")
            filename = f"{filename_base}.html"
        elif export_format == "xlsx":
            payload = self._render_xlsx(
                binder_name=binder_name,
                phase=phase,
                items=items,
            )
            filename = f"{filename_base}.xlsx"
        elif export_format == "pdf":
            payload = self._render_pdf(
                binder_name=binder_name,
                binder_description=binder_description,
                phase=phase,
                presenter_notes=presenter_notes,
                items=items,
                generated_at=generated_at,
            )
            filename = f"{filename_base}.pdf"
        else:
            raise ValueError("Unsupported export format")
        return self.export_store.save_export(binder_id, export_format, payload, filename)

    @staticmethod
    def _render_markdown(
        *,
        binder_name: str,
        binder_description: str | None,
        phase: str | None,
        presenter_notes: str | None,
        items: List[PresentationExportItemModel],
        generated_at: str,
    ) -> str:
        lines = [
            f"# Presentation Binder: {binder_name}",
            "",
            f"Generated at: {generated_at}",
            f"Phase: {phase or 'Unspecified'}",
        ]
        if binder_description:
            lines.extend(["", binder_description])
        lines.append("")
        lines.append("## Exhibits")
        for idx, item in enumerate(items, start=1):
            lines.append(f"{idx}. {item.name} (`{item.document_id}`)")
            if item.description:
                lines.append(f"   - Description: {item.description}")
            lines.append(f"   - Added: {item.added_at.isoformat()}")
            if item.citations:
                lines.append(f"   - Citations: {', '.join(item.citations)}")
        if presenter_notes:
            lines.extend(["", "## Presenter Notes", "", presenter_notes])
        return "\n".join(lines)

    @staticmethod
    def _render_html(
        *,
        binder_name: str,
        binder_description: str | None,
        phase: str | None,
        presenter_notes: str | None,
        items: List[PresentationExportItemModel],
        generated_at: str,
    ) -> str:
        rows = []
        for item in items:
            rows.append(
                "<tr>"
                f"<td>{item.document_id}</td>"
                f"<td>{item.name}</td>"
                f"<td>{item.description or ''}</td>"
                f"<td>{item.added_at.isoformat()}</td>"
                f"<td>{', '.join(item.citations)}</td>"
                "</tr>"
            )
        notes_html = f"<section><h2>Presenter Notes</h2><pre>{presenter_notes}</pre></section>" if presenter_notes else ""
        description_html = f"<p>{binder_description}</p>" if binder_description else ""
        return (
            "<!doctype html><html><head><meta charset='utf-8'/>"
            "<title>Presentation Export</title>"
            "<style>body{font-family:Arial,sans-serif;padding:24px;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ddd;padding:8px;vertical-align:top;}th{background:#f5f5f5;}pre{white-space:pre-wrap;}</style>"
            "</head><body>"
            f"<h1>{binder_name}</h1><p><strong>Generated:</strong> {generated_at}<br/><strong>Phase:</strong> {phase or 'Unspecified'}</p>"
            f"{description_html}"
            "<table><thead><tr><th>Document ID</th><th>Name</th><th>Description</th><th>Added</th><th>Citations</th></tr></thead><tbody>"
            + "".join(rows)
            + "</tbody></table>"
            + notes_html
            + "</body></html>"
        )

    @staticmethod
    def _render_xlsx(
        *,
        binder_name: str,
        phase: str | None,
        items: List[PresentationExportItemModel],
    ) -> bytes:
        try:
            import pandas as pd
        except ImportError as exc:
            raise ValueError("pandas is required for XLSX export") from exc
        table = [
            {
                "document_id": item.document_id,
                "name": item.name,
                "description": item.description or "",
                "added_at": item.added_at.isoformat(),
                "citations": ", ".join(item.citations),
                "phase": phase or "",
                "binder": binder_name,
            }
            for item in items
        ]
        output = BytesIO()
        try:
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                pd.DataFrame(table).to_excel(writer, index=False, sheet_name="Exhibits")
        except ImportError as exc:
            raise ValueError("openpyxl is required for XLSX export") from exc
        return output.getvalue()

    @staticmethod
    def _render_pdf(
        *,
        binder_name: str,
        binder_description: str | None,
        phase: str | None,
        presenter_notes: str | None,
        items: List[PresentationExportItemModel],
        generated_at: str,
    ) -> bytes:
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
        except ImportError as exc:
            raise ValueError("reportlab is required for PDF export") from exc
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        _, height = letter
        y = height - 40
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(40, y, f"Presentation Binder: {binder_name}")
        y -= 18
        pdf.setFont("Helvetica", 9)
        pdf.drawString(40, y, f"Generated: {generated_at} | Phase: {phase or 'Unspecified'}")
        y -= 18
        if binder_description:
            pdf.drawString(40, y, binder_description[:110])
            y -= 18

        def write_line(text: str) -> None:
            nonlocal y
            if y < 60:
                pdf.showPage()
                y = height - 40
                pdf.setFont("Helvetica", 9)
            pdf.drawString(40, y, text[:120])
            y -= 13

        for idx, item in enumerate(items, start=1):
            write_line(f"{idx}. {item.name} ({item.document_id})")
            if item.description:
                write_line(f"   {item.description}")
            if item.citations:
                write_line(f"   Citations: {', '.join(item.citations)}")
        if presenter_notes:
            write_line(" ")
            write_line("Presenter Notes:")
            for line in presenter_notes.splitlines():
                write_line(f"  {line}")
        pdf.save()
        return buffer.getvalue()
