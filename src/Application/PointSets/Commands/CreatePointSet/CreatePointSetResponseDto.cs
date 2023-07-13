﻿using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.PointSets.Commands.CreatePointSet;

public record CreatePointSetResponseDto : IMapFrom<PointSet>
{
	public int Id { get; set; }

	public string Path { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public long FileSize { get; set; }

	public int Order { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }
}
