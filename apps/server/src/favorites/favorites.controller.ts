import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AddFavoriteDto,
  AddFavoriteSchema,
  FavoriteRecordDto,
} from './favorites.dto';
import { FavoritesService } from './favorites.service';

const OkResponse = {
  schema: { properties: { ok: { type: 'boolean', example: true } } },
};

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: '获取全部收藏（按保存时间倒序）' })
  @ApiOkResponse({ type: [FavoriteRecordDto] })
  getAll() {
    return this.favoritesService.getAll();
  }

  @Post()
  @ApiOperation({ summary: '添加收藏' })
  @ApiBody({ type: AddFavoriteDto })
  @ApiCreatedResponse(OkResponse)
  @ApiBadRequestResponse({ description: '请求体校验失败' })
  add(@Body() body: unknown) {
    const result = AddFavoriteSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    this.favoritesService.add(result.data);
    return { ok: true };
  }

  @Delete()
  @ApiOperation({ summary: '清空所有收藏' })
  @ApiOkResponse(OkResponse)
  clearAll() {
    this.favoritesService.clearAll();
    return { ok: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除单条收藏' })
  @ApiParam({ name: 'id', description: '收藏记录 ID' })
  @ApiOkResponse(OkResponse)
  remove(@Param('id') id: number) {
    this.favoritesService.remove(id);
    return { ok: true };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新收藏的 updatedAt，使该条浮动到列表顶部' })
  @ApiParam({ name: 'id', description: '收藏记录 ID' })
  @ApiOkResponse({
    schema: {
      properties: {
        ok: { type: 'boolean', example: true },
        updatedAt: { type: 'integer', example: 1735689600000 },
      },
    },
  })
  @ApiNotFoundResponse({ description: '收藏记录不存在' })
  touch(@Param('id') id: number) {
    const result = this.favoritesService.touch(id);
    if (!result) throw new NotFoundException(`Favorite ${id} not found`);
    return { ok: true, updatedAt: result.updatedAt };
  }
}
