---
version: project
name: CSR-enterprise-groupware-design
description: CSR 화면에 적용하는 실사용 기준 디자인 문서입니다. `frontend/notion/DESIGN.md`는 getdesign 원본 참고 자료로 보관하고, 실제 화면은 기업 그룹웨어형 업무 UI를 우선합니다.
---

# CSR Enterprise Groupware Design

## Direction

- 전체 화면은 고객 지원 요청, 프로젝트, 사용자, 실적, 설정을 반복적으로 처리하는 사무형 업무 도구로 보이게 한다.
- 개성 강한 마케팅형 색상, 큰 히어로, 장식 배경, 과한 라운드, 팝업 중심 흐름은 제외한다.
- 목록, 필터, 입력, 상태, 처리 액션이 한 화면에서 예측 가능하게 이어지도록 배치한다.
- 생성/수정/상세 확인은 가능한 한 Dialog 대신 화면 내부 인라인 패널이나 우측/하단 패널로 처리한다.

## Colors

- Primary: `#2563eb`
- Primary deep: `#1d4ed8`
- Primary soft: `#e8f1ff`
- Navigation/secondary: `#1f2937`
- Text primary: `#1f2937`
- Text secondary: `#4b5563`
- Muted: `#9ca3af`
- Page background: `#f3f4f6`
- Paper: `#ffffff`
- Divider/border: `#d9dee7`
- Success: `#16a34a`
- Warning: `#d97706`
- Error: `#dc2626`

## Typography

- Font family: `"Notion Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`
- Page title: 20px mobile, 22px desktop, 600 weight, line-height 1.25
- Section title: 18-20px, 600 weight
- Table/card title: 16-18px, 600 weight
- Body: 14-16px, line-height 1.5-1.55
- Caption/status: 12-13px
- Letter spacing is always `0`.

## Shape And Density

- Buttons, inputs, icon buttons: 6px radius
- Cards and table containers: 8px radius
- Chips/status labels: 4px radius, not pill shaped
- Page header height: about 76px
- Primary content padding: 24px
- Card/panel padding: 20px
- Shadows are minimal; borders define most surfaces.

## Layout Rules

- Every main screen starts with the shared `PageHeader`.
- The page body uses a light gray background and white working surfaces.
- Dense data screens should prioritize filter row, action row, table, then inline edit/detail panel.
- Do not place cards inside cards unless it is a repeated list item or an actual form/editor surface.
- Buttons should stay compact and action-oriented. Primary actions use filled blue, secondary actions use outlined/neutral styling.
- Destructive actions use red only for the final action, not as a large visual theme.

## Interaction Rules

- Prefer inline panels for create, edit, test, and detail flows.
- Keep Snackbar only for result feedback.
- Replace `window.confirm` flows gradually with in-page confirmation states near the affected row or panel.
- Use Dialog only for truly blocking flows that cannot be represented in context.
- Tables should keep stable row height and compact icon actions.
