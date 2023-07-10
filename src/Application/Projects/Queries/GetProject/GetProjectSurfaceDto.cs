﻿using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public record GetProjectSurfaceDto : IMapFrom<Surface>
{
	public int Id { get; set; }

	public string Path { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public long FileSize { get; set; }

	public int Order { get; set; }

	public string? Color { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public ICollection<GetProjectAnnotationDto> Annotations { get; set; } = null!;

	public ICollection<GetProjectOverlayDto> Overlays { get; set; } = null!;
}
